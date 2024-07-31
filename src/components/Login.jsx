import { useState } from "react";
import { FaEye } from "react-icons/fa6";
import { FaEyeSlash } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const loginURL = "http://localhost:8081/api/v0/login";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      const options = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: email, password: password }),
      };
      try {
        const response = await fetch(loginURL, options);
        const data = await response.json();
        if (!data.message) {
          const user = {
            email: data.username,
            id: data.id,
            balance: data.balance,
          };
          localStorage.setItem("user", JSON.stringify(user));
          navigate("/home");
        } else {
          const newErrors = {};
          newErrors.message = "Invalid credentials";
          setErrors(newErrors);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Email is invalid";

    if (!password) newErrors.password = "Password is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <div className="login-main">
      <div className="login-right">
        <div className="login-right-container">
          <div className="login-center">
            <h2>Login</h2>
            <form>
              <input
                className="inputkeyboard"
                placeholder="email"
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && <span>{errors.email}</span>}

              <div className="pass-input-div">
                <input
                  className="inputkeyboard"
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  placeholder="Password"
                  onChange={(e) => setPassword(e.target.value)}
                />
                {showPassword ? (
                  <FaEyeSlash
                    onClick={() => {
                      setShowPassword(!showPassword);
                    }}
                  />
                ) : (
                  <FaEye
                    onClick={() => {
                      setShowPassword(!showPassword);
                    }}
                  />
                )}
              </div>
              {errors.password && <span>{errors.password}</span>}
              {errors.message && <span>{errors.message}</span>}
              <div className="login-center-buttons">
                <button type="button" className="button-round" onClick={handleSubmit}>
                  Log In
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
