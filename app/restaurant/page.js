"use client";

import { useState } from "react";

export default function RestaurantPage() {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [guests, setGuests] = useState("2");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleReservation() {
    if (!date || !time || !name || !phone) {
      setMessage("Completează toate câmpurile.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const supabaseUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL;

      const supabaseKey =
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        setMessage("Conexiunea cu baza de date nu este configurată.");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${supabaseUrl}/rest/v1/reservations`,
        {
          method: "POST",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            restaurant_name: "Casa Bunicii",
            reservation_date: date,
            reservation_time: time,
            guests: Number(guests),
            customer_name: name,
            customer_phone: phone,
            status: "pending",
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(errorText);
        setMessage("A apărut o eroare la rezervare.");
        return;
      }

      setMessage("Rezervarea a fost trimisă cu succes! ✅");

      setDate("");
      setTime("");
      setGuests("2");
      setName("");
      setPhone("");
    } catch (error) {
      console.error(error);
      setMessage("A apărut o eroare la rezervare.");
    } finally {
      setLoading(false);
    }
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <main
      style={{
        fontFamily: "Arial, sans-serif",
        background: "#f7f7f7",
        minHeight: "100vh",
        padding: "40px 6%",
        color: "#222",
      }}
    >
      <div
        style={{
          maxWidth: "800px",
          margin: "auto",
          background: "white",
          padding: "35px",
          borderRadius: "20px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
        }}
      >
        <a
          href="/"
          style={{
            textDecoration: "none",
            color: "#555",
          }}
        >
          ← Înapoi la restaurante
        </a>

        <h1
          style={{
            fontSize: "36px",
            marginBottom: "10px",
          }}
        >
          Casa Bunicii
        </h1>

        <p>📍 Timișoara</p>

        <p>⭐ 9.2 • Bucătărie românească</p>

        <div
          style={{
            background: "#fff1ed",
            padding: "20px",
            borderRadius: "15px",
            marginTop: "25px",
          }}
        >
          <h2
            style={{
              color: "#ff5a3c",
              margin: 0,
            }}
          >
            -30% reducere
          </h2>

          <p>
            Reducerea se aplică la nota de plată.
          </p>
        </div>

        <h2
          style={{
            marginTop: "35px",
          }}
        >
          Rezervă o masă
        </h2>

        <div
          style={{
            display: "grid",
            gap: "15px",
            marginTop: "20px",
          }}
        >
          <label style={{ fontWeight: "bold" }}>
            Data rezervării
          </label>

          <input
            type="date"
            value={date}
            min={today}
            onChange={(e) => setDate(e.target.value)}
            style={{
              padding: "15px",
              borderRadius: "10px",
              border: "1px solid #ddd",
              fontSize: "16px",
            }}
          />

          <label style={{ fontWeight: "bold" }}>
            Ora
          </label>

          <select
            value={time}
            onChange={(e) => setTime(e.target.value)}
            style={{
              padding: "15px",
              borderRadius: "10px",
              border: "1px solid #ddd",
              fontSize: "16px",
            }}
          >
            <option value="">Alege ora</option>
            <option value="18:00">18:00</option>
            <option value="18:30">18:30</option>
            <option value="19:00">19:00</option>
            <option value="19:30">19:30</option>
            <option value="20:00">20:00</option>
            <option value="20:30">20:30</option>
            <option value="21:00">21:00</option>
          </select>

          <label style={{ fontWeight: "bold" }}>
            Număr de persoane
          </label>

          <select
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            style={{
              padding: "15px",
              borderRadius: "10px",
              border: "1px solid #ddd",
              fontSize: "16px",
            }}
          >
            <option value="1">1 persoană</option>
            <option value="2">2 persoane</option>
            <option value="3">3 persoane</option>
            <option value="4">4 persoane</option>
            <option value="5">5 persoane</option>
            <option value="6">6 persoane</option>
            <option value="7">7 persoane</option>
            <option value="8">8 persoane</option>
          </select>

          <label style={{ fontWeight: "bold" }}>
            Nume
          </label>

          <input
            type="text"
            placeholder="Numele tău"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              padding: "15px",
              borderRadius: "10px",
              border: "1px solid #ddd",
              fontSize: "16px",
            }}
          />

          <label style={{ fontWeight: "bold" }}>
            Număr de telefon
          </label>

          <input
            type="tel"
            placeholder="07xx xxx xxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{
              padding: "15px",
              borderRadius: "10px",
              border: "1px solid #ddd",
              fontSize: "16px",
            }}
          />

          <button
            onClick={handleReservation}
            disabled={loading}
            style={{
              background: "#ff5a3c",
              color: "white",
              border: "none",
              borderRadius: "10px",
              padding: "16px",
              fontSize: "17px",
              fontWeight: "bold",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              marginTop: "5px",
            }}
          >
            {loading
              ? "Se trimite..."
              : "Rezervă masa"}
          </button>

          {message && (
            <p
              style={{
                textAlign: "center",
                fontWeight: "bold",
                marginTop: "5px",
              }}
            >
              {message}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
