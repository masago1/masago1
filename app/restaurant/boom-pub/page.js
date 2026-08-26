"use client";

import { useState } from "react";

export default function BoomPubPage() {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("19:00");
  const [guests, setGuests] = useState("2");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleReservation() {
    setMessage("");

    if (!date) {
      setMessage("Alege data rezervării.");
      return;
    }

    if (!time) {
      setMessage("Alege ora rezervării.");
      return;
    }

    if (!name.trim()) {
      setMessage("Introdu numele.");
      return;
    }

    if (!phone.trim()) {
      setMessage("Introdu numărul de telefon.");
      return;
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      setMessage("Conexiunea cu Supabase nu este configurată.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/reservations`,
        {
          method: "POST",
          headers: {
            apikey: supabaseKey,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify({
            restaurant_name: "Boom Pub",
            reservation_date: date,
            reservation_time: time,
            guests: Number(guests),
            customer_name: name.trim(),
            customer_phone: phone.trim(),
            status: "pending",
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Supabase error:", errorText);
        setMessage(`Eroare Supabase: ${errorText}`);
        return;
      }

      setMessage("✅ Rezervarea a fost trimisă cu succes!");

      setDate("");
      setTime("19:00");
      setGuests("2");
      setName("");
      setPhone("");
    } catch (error) {
      console.error(error);
      setMessage(`Eroare: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "14px",
    border: "1px solid #ddd",
    borderRadius: "9px",
    fontSize: "16px",
    background: "white",
  };

  const labelStyle = {
    display: "block",
    fontWeight: "bold",
    marginTop: "18px",
    marginBottom: "7px",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f6f6f6",
        padding: "40px 20px",
        fontFamily: "Arial, sans-serif",
        color: "#222",
      }}
    >
      <div
        style={{
          maxWidth: "760px",
          margin: "0 auto",
          background: "white",
          borderRadius: "18px",
          padding: "32px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
        }}
      >
        <a
          href="/"
          style={{
            textDecoration: "none",
            color: "#666",
          }}
        >
          ← Înapoi la Masago
        </a>

        <div
          style={{
            marginTop: "28px",
            marginBottom: "30px",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "34px",
            }}
          >
            Boom Pub
          </h1>

          <p
            style={{
              color: "#666",
              marginTop: "8px",
            }}
          >
            Pub • Timișoara
          </p>

          <div
            style={{
              marginTop: "18px",
              background: "#fff0ec",
              padding: "20px",
              borderRadius: "15px",
            }}
          >
            <div
              style={{
                display: "inline-block",
                background: "#ff5a43",
                color: "white",
                fontWeight: "bold",
                fontSize: "24px",
                padding: "10px 18px",
                borderRadius: "10px",
              }}
            >
              -20%
            </div>

            <p
              style={{
                color: "#666",
                fontSize: "14px",
                marginBottom: 0,
              }}
            >
              Reducerea se aplică la nota de plată conform condițiilor
              restaurantului.
            </p>
          </div>
        </div>

        <h2>Rezervă o masă</h2>

        <label style={labelStyle}>Data rezervării</label>

        <input
          type="date"
          value={date}
          min={new Date().toISOString().split("T")[0]}
          onChange={(e) => setDate(e.target.value)}
          style={inputStyle}
        />

        {date && (
          <div
            style={{
              color: "#777",
              fontSize: "14px",
              marginTop: "7px",
            }}
          >
            Data selectată:{" "}
            <strong>
              {date.split("-").reverse().join("/")}
            </strong>
          </div>
        )}

        <label style={labelStyle}>Ora</label>

        <select
          value={time}
          onChange={(e) => setTime(e.target.value)}
          style={inputStyle}
        >
          <option value="17:00">17:00</option>
          <option value="17:30">17:30</option>
          <option value="18:00">18:00</option>
          <option value="18:30">18:30</option>
          <option value="19:00">19:00</option>
          <option value="19:30">19:30</option>
          <option value="20:00">20:00</option>
          <option value="20:30">20:30</option>
          <option value="21:00">21:00</option>
          <option value="21:30">21:30</option>
          <option value="22:00">22:00</option>
        </select>

        <label style={labelStyle}>Număr de persoane</label>

        <select
          value={guests}
          onChange={(e) => setGuests(e.target.value)}
          style={inputStyle}
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

        <label style={labelStyle}>Nume</label>

        <input
          type="text"
          placeholder="Numele tău"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={inputStyle}
        />

        <label style={labelStyle}>Număr de telefon</label>

        <input
          type="tel"
          placeholder="07xxxxxxxx"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={inputStyle}
        />

        <button
          onClick={handleReservation}
          disabled={loading}
          style={{
            width: "100%",
            marginTop: "22px",
            border: "none",
            borderRadius: "10px",
            padding: "16px",
            background: loading ? "#aaa" : "#ff5a43",
            color: "white",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Se trimite..." : "Rezervă masa"}
        </button>

        {message && (
          <div
            style={{
              marginTop: "18px",
              textAlign: "center",
              fontWeight: "bold",
              wordBreak: "break-word",
            }}
          >
            {message}
          </div>
        )}
      </div>
    </main>
  );
}
