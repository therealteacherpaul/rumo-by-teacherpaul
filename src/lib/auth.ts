type AuthError = {
  code: string | undefined;
  status: number | undefined;
  message: string | undefined;
};

export function authErrorMessage(action: "login" | "signup" | "logout", error?: AuthError) {
  if (action === "logout") return "Não foi possível sair. Tente novamente.";
  if (action === "signup") {
    if (error?.code === "user_already_exists" || error?.code === "email_exists") {
      return "Este email já está cadastrado.";
    }
    if (error?.code === "weak_password" || error?.message?.toLowerCase().includes("password")) {
      return "A senha não atende aos requisitos mínimos.";
    }
    return "Não foi possível criar a conta. Confira os dados e tente novamente.";
  }
  if (error?.status === 429) return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
  return "Não foi possível entrar. Confira seu e-mail e senha.";
}
