// Local PostgreSQL engine only. Never connects to a Supabase project.
// RUMO_TEST_MODULES=/tmp/rumo-f2-tests/node_modules node --test tests/habits-sql.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
const requireTest = createRequire(`${process.env.RUMO_TEST_MODULES}/package.json`);
const { PGlite } = requireTest("@electric-sql/pglite");

test("habit migration: constraints, CRUD, initialization and RLS isolation", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated;
      create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth,public to authenticated,anon;
      grant execute on function auth.uid() to authenticated,anon;
      insert into auth.users values ('00000000-0000-0000-0000-000000000001'),
        ('00000000-0000-0000-0000-000000000002'),('00000000-0000-0000-0000-000000000003');`);
    await db.exec(
      await readFile(
        new URL("../supabase/migrations/20260919025408_authenticated_habits.sql", import.meta.url),
        "utf8",
      ),
    );
    const query = async (sql) => (await db.query(sql)).rows;
    const count = async (table) =>
      Number((await query(`select count(*) as n from public.${table}`))[0].n);
    const asUser = async (n) =>
      db.exec(
        `reset role; set role authenticated; set request.jwt.claim.sub='00000000-0000-0000-0000-00000000000${n}';`,
      );
    const fails = async (sql, code) => assert.rejects(db.exec(sql), (e) => e.code === code);
    await asUser(1);
    await db.exec(
      "select public.initialize_user_habits(); select public.initialize_user_habits();",
    );
    assert.equal(await count("user_habits"), 8, "seed once");
    const a = (await query("select id from user_habits limit 1"))[0].id;
    await db.exec(`insert into habit_check_ins(habit_id,date,value,mode) values('${a}','2026-09-19',1,'principal');
      update habit_check_ins set value=2 where habit_id='${a}';
      update user_habits set name='Meu hábito editado',active=false where id='${a}';`);
    assert.equal((await query("select value from habit_check_ins"))[0].value, "2");
    await fails(
      `insert into user_habits(name,frequency_type,target_type,target_value,user_id) values('Intrusão','daily','occurrence',1,'00000000-0000-0000-0000-000000000002')`,
      "42501",
    );
    await fails(
      `update user_habits set user_id='00000000-0000-0000-0000-000000000002' where id='${a}'`,
      "23514",
    );
    await fails(
      `insert into user_habits(name,source,frequency_type,target_type,target_value) values('Falso padrão','system','daily','occurrence',1)`,
      "23514",
    );
    for (const values of [
      "'','daily',null,1",
      "'Inválido','everyDays',null,1",
      "'Inválido','everyHours',25,1",
      "'Inválido','daily',null,0",
      "'Inválido','daily',null,'NaN'",
    ]) {
      await fails(
        `insert into user_habits(name,frequency_type,frequency_interval,target_value,target_type) values(${values},'occurrence')`,
        "23514",
      );
    }
    await fails(
      `insert into user_habits(name,frequency_type,target_type,target_value) values('  Meu hábito EDITADO ','daily','occurrence',1)`,
      "23505",
    );
    await fails(`update user_habits set minimum_value=target_value+1 where id='${a}'`, "23514");
    await fails(
      `insert into habit_check_ins(habit_id,date,value,mode) values('${a}','2026-09-20',-1,'principal')`,
      "23514",
    );
    await fails(`update habit_check_ins set date='2026-09-20'`, "23514");
    await fails("delete from habit_initializations", "42501");
    await asUser(2);
    assert.equal(await count("user_habits"), 0, "user B cannot see A");
    assert.equal(await count("habit_check_ins"), 0);
    assert.equal(await count("habit_initializations"), 0);
    await db.exec(`update user_habits set name='Ataque' where id='${a}'; delete from user_habits where id='${a}';
      update habit_check_ins set value=99 where habit_id='${a}'; delete from habit_check_ins where habit_id='${a}';`);
    await fails(
      `insert into habit_check_ins(habit_id,date,value,mode) values('${a}','2026-09-19',1,'principal')`,
      "23503",
    );
    await fails(
      `insert into habit_check_ins(user_id,habit_id,date,value,mode) values('00000000-0000-0000-0000-000000000001','${a}','2026-09-20',1,'principal')`,
      "42501",
    );
    await db.exec("select initialize_user_habits();");
    assert.equal(await count("user_habits"), 8);
    await db.exec(`insert into user_habits(name,frequency_type,target_type,target_value)
      select 'Ativo '||n,'daily','occurrence',1 from generate_series(1,4)n;`);
    await fails(
      `insert into user_habits(name,frequency_type,target_type,target_value)
      values('Décimo terceiro','daily','occurrence',1)`,
      "23514",
    );
    await asUser(1);
    assert.equal(
      (await query(`select name from user_habits where id='${a}'`))[0].name,
      "Meu hábito editado",
    );
    assert.equal((await query("select value from habit_check_ins"))[0].value, "2");
    await db.exec(`delete from user_habits where id='${a}'; select initialize_user_habits();`);
    assert.equal(await count("user_habits"), 7, "deleted default stays deleted");
    assert.equal(await count("habit_check_ins"), 0, "cascade deletes check-ins");
    await db.exec("delete from user_habits; select initialize_user_habits();");
    assert.equal(await count("user_habits"), 0, "empty collection remains empty");
    await asUser(3);
    await db.exec(
      `insert into user_habits(name,frequency_type,target_type,target_value) values('Já existente','daily','occurrence',1); select initialize_user_habits();`,
    );
    assert.equal(await count("user_habits"), 1, "existing collection preserved");
    await db.exec(
      `insert into user_habits(name,frequency_type,target_type,target_value) select 'Custom '||n,'daily','occurrence',1 from generate_series(1,9)n;`,
    );
    await fails(
      `insert into user_habits(name,frequency_type,target_type,target_value) values('Excedente','daily','occurrence',1)`,
      "23514",
    );
    await db.exec("reset role; set role anon;");
    for (const table of ["user_habits", "habit_check_ins", "habit_initializations"])
      await fails(`select * from ${table}`, "42501");
    await fails("select initialize_user_habits()", "42501");
    await db.exec("reset role; set role authenticated; set request.jwt.claim.sub='';");
    assert.equal(await count("user_habits"), 0);
    await fails("select initialize_user_habits()", "42501");
  } finally {
    await db.close();
  }
});
