export function authErrorMessage(action: "login" | "signup" | "logout") {
  if (action === "logout") return "Não foi possível sair. Tente novamente.";
  if (action === "signup")
    return "Não foi possível criar a conta. Confira os dados e tente novamente.";
  return "Não foi possível entrar. Confira seu e-mail e senha.";
}
