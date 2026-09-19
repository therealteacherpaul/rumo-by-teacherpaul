// Test-only dependencies live outside the checkout; no remote requests are allowed.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
const requireTest = createRequire(`${process.env.RUMO_TEST_MODULES}/package.json`);
const React = requireTest("react");
const { create, act } = requireTest("react-test-renderer");
const { build } = requireTest("esbuild");
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const dir = await mkdtemp(path.join(path.dirname(process.env.RUMO_TEST_MODULES), "habit-test-"));
await build({
  stdin: {
    contents: `export {AuthenticatedHabitProvider} from './src/components/habits/AuthenticatedHabitProvider';
 export {DemoHabitProvider} from './src/components/habits/DemoHabitProvider';
 export {HabitContext} from './src/components/habits/habit-context';`,
    resolveDir: process.cwd(),
  },
  outfile: path.join(dir, "providers.mjs"),
  bundle: true,
  format: "esm",
  platform: "node",
  jsx: "automatic",
  external: ["react", "react/jsx-runtime"],
  plugins: [
    {
      name: "deny-remote",
      setup(b) {
        b.onResolve({ filter: /habit-repository$/ }, () => ({ path: "denied", namespace: "test" }));
        b.onLoad({ filter: /.*/, namespace: "test" }, () => ({
          contents:
            'export const habitRepository = new Proxy({}, { get() { throw new Error("Unexpected remote repository access"); } });',
        }));
      },
    },
  ],
});
const { AuthenticatedHabitProvider, DemoHabitProvider, HabitContext } = await import(
  path.join(dir, "providers.mjs")
);
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
};
const habit = (id = "one") => ({
  id,
  name: "Hábito real",
  source: "user",
  active: true,
  frequency: { type: "daily" },
  target: { type: "occurrence", target: 1 },
  startDate: "2026-09-19",
});
let current;
function Consumer() {
  current = React.useContext(HabitContext);
  return React.createElement("span", null, current.habits.map((h) => h.name).join(","));
}
const view = (id, repository) =>
  React.createElement(
    AuthenticatedHabitProvider,
    { userId: id, repository },
    React.createElement(Consumer),
  );

test("provider: loading, errors/retry, empty state, no fixture fallback and stale-user isolation", async () => {
  const a = deferred(),
    b = deferred();
  let root;
  const repo = { load: (id) => (id === "a" ? a.promise : b.promise) };
  await act(async () => {
    root = create(view("a", repo));
  });
  assert.equal(current.loading, true);
  assert.deepEqual(current.habits, []);
  await act(async () => root.update(view("b", repo)));
  await act(async () => a.resolve({ habits: [habit()], checkIns: [] }));
  assert.deepEqual(current.habits, [], "late A response must not enter B state");
  await act(async () => b.reject(new Error("offline")));
  assert.equal(current.loading, false);
  assert.ok(current.error);
  assert.deepEqual(current.habits, []);
  repo.load = async () => ({ habits: [], checkIns: [] });
  await act(async () => current.reload());
  assert.equal(current.error, "");
  assert.deepEqual(current.habits, [], "authenticated empty never becomes demo");
  await act(async () => root.unmount());
});

test("provider: CRUD/check-in persistence across remount, pending guard and recovery", async () => {
  let saved = { habits: [habit()], checkIns: [] },
    writes = 0,
    root;
  const repo = {
    load: async () => structuredClone(saved),
    save: async (h, id) => {
      writes++;
      if (id) saved.habits = saved.habits.map((x) => (x.id === id ? { ...h, id } : x));
      else saved.habits.push({ ...h, id: "two" });
    },
    setActive: async (id, active) => {
      saved.habits = saved.habits.map((h) => (h.id === id ? { ...h, active } : h));
    },
    remove: async (id) => {
      saved.habits = saved.habits.filter((h) => h.id !== id);
    },
    record: async (c) => {
      saved.checkIns = [c];
    },
    clear: async () => {
      saved.checkIns = [];
    },
  };
  await act(async () => {
    root = create(view("a", repo));
  });
  await act(async () =>
    assert.equal((await current.createHabit({ ...habit(), name: "Segundo" })).valid, true),
  );
  assert.equal(current.habits.length, 2);
  await act(async () =>
    current.updateHabit("one", {
      name: "Renomeado",
      frequency: { type: "daily" },
      target: { type: "durationMin", target: 10 },
    }),
  );
  assert.equal(current.habits[0].name, "Renomeado");
  await act(async () =>
    current.recordCheckIn({
      habitId: "one",
      date: "2026-09-19",
      value: 10,
      completed: true,
      mode: "principal",
    }),
  );
  assert.equal(current.getHabitStatus(current.habits[0], "2026-09-19"), "feito");
  await act(async () => root.unmount());
  await act(async () => {
    root = create(view("a", repo));
  });
  assert.equal(current.habits.length, 2);
  assert.equal(current.checkIns.length, 1, "fresh provider reloads persisted record");
  await act(async () => current.clearCheckIn("one", "2026-09-19"));
  assert.equal(current.getHabitStatus(current.habits[0], "2026-09-19"), "nao_registrado");
  await act(async () => current.deactivateHabit("one"));
  assert.equal(current.activeHabits.length, 1);
  await act(async () => current.activateHabit("one"));
  assert.equal(current.activeHabits.length, 2);
  await act(async () => current.deleteHabit("two"));
  assert.equal(current.habits.length, 1);
  const gate = deferred();
  repo.save = () => {
    writes++;
    return gate.promise;
  };
  let mutation;
  await act(async () => {
    mutation = current.renameHabit("one", "Pendente");
  });
  assert.equal(current.pending, true);
  await act(async () => assert.equal((await current.renameHabit("one", "Duplicado")).valid, false));
  assert.equal(writes, 3, "only one pending write");
  await act(async () => {
    gate.reject(new Error("offline"));
    await mutation;
  });
  assert.ok(current.error);
  assert.equal(current.pending, false);
  await act(async () => current.reload());
  assert.equal(current.error, "");
  await act(async () => root.unmount());
});

test("demo provider remains local, fixture based and resets on remount", async () => {
  let root;
  await act(async () => {
    root = create(React.createElement(DemoHabitProvider, null, React.createElement(Consumer)));
  });
  assert.equal(current.habits.length, 8);
  assert.ok(current.habits.every((h) => h.id.startsWith("habit-")));
  const id = current.habits[0].id;
  await act(async () => current.renameHabit(id, "Somente demo"));
  assert.equal(current.habits[0].name, "Somente demo");
  await act(async () => root.unmount());
  await act(async () => {
    root = create(React.createElement(DemoHabitProvider, null, React.createElement(Consumer)));
  });
  assert.notEqual(current.habits[0].name, "Somente demo");
  await act(async () => root.unmount());
});
after(async () => rm(dir, { recursive: true, force: true }));
