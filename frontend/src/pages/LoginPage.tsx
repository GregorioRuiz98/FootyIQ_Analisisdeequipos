import { FormEvent, useState } from "react";
import { login, register } from "../services/api";

type Props = {
  onAuthenticated: () => void;
};

export function LoginPage({ onAuthenticated }: Props): JSX.Element {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("analista");
  const [email, setEmail] = useState("analista@footyiq.local");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");

  const fillDemoCredentials = (): void => {
    setUsername("demo");
    setPassword("123456");
    setEmail("demo@footyiq.local");
    setIsRegister(false);
    setError("");
  };

  const onSubmit = async (evt: FormEvent): Promise<void> => {
    evt.preventDefault();
    setError("");
    try {
      if (isRegister) {
        await register(username, email, password);
      } else {
        await login(username, password);
      }
      onAuthenticated();
    } catch {
      setError("No se pudo autenticar. Si no tienes usuario, usa registro.");
    }
  };

  return (
    <div className="login-screen">
      <form className="login-card glass-panel" onSubmit={onSubmit}>
        <h1>FOOTY IQ</h1>
        <p>Plataforma de analisis profesional de futbol</p>
        <label className="field">
          Usuario
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </label>
        {isRegister && (
          <label className="field">
            Email
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              type="email"
            />
          </label>
        )}
        <label className="field">
          Contrasena
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            type="password"
          />
        </label>
        {error && <p className="error-msg">{error}</p>}
        <button className="cta" type="submit">
          {isRegister ? "Crear cuenta" : "Entrar"}
        </button>
        <button
          type="button"
          className="icon-btn big demo-fill-btn"
          onClick={fillDemoCredentials}
        >
          Rellenar cuenta demo
        </button>
        <button
          type="button"
          className="link-btn"
          onClick={() => setIsRegister((v) => !v)}
        >
          {isRegister ? "Login" : "Regístrate"}
        </button>
      </form>
    </div>
  );
}
