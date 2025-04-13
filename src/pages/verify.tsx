import { useEffect, useState } from "react";
import { supabase } from '../types/supabase'
import { useNavigate } from "react-router-dom";

export default function Verify() {
  const [status, setStatus] = useState("Verifying...");
  const navigate = useNavigate();

  useEffect(() => {
    const verify = async () => {
      const { error } = await supabase.auth.getSession();
      if (error) {
        setStatus("Verification failed.");
        return;
      }

      setStatus("Login successful. Redirecting...");
      setTimeout(() => navigate("/dashboard"), 2000);
    };

    verify();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="rounded-2xl bg-white px-6 py-10 shadow-xl">
        <h2 className="text-xl font-semibold text-gray-800">{status}</h2>
      </div>
    </div>
  );
}
