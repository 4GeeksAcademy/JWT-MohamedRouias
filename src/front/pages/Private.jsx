import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Private = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const BASE_URL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    fetch(`${BASE_URL}/private`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Token inválido");
        }
        return res.json();
      })
      .then((data) => {
        setUser(data.user);
      })
      .catch((err) => {
        console.error(err);
        navigate("/login");
      });
  }, [navigate, BASE_URL]);

  if (!user) return <p className="text-center mt-5">Cargando...</p>;

  return (
    <div className="container mt-5">
      <h2>Bienvenido, {user.email}</h2>
      <p><strong>ID:</strong> {user.id}</p>
      <p><strong>Activo:</strong> {user.is_active ? "Sí" : "No"}</p>
    </div>
  );
};

export default Private;
