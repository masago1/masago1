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

  // Formateaza automat data ca ZZ/LL/AAAA
  function handleDateChange(e) {
    let value = e.target.value.replace(/\D/g, "");

    if (value.length > 8) {
      value = value.slice(0, 8);
    }

    if (value.length >= 5) {
      value =
        value.slice(0, 2) +
        "/" +
        value.slice(2, 4) +
        "/" +
        value.slice(4);
    } else if (value.length >= 3) {
      value =
        value.slice(0, 2) +
        "/" +
        value.slice(2);
    }

    setDate(value);
  }

  // Converteste ZZ/LL/AAAA in YYYY-MM-DD pentru Supabase
  function convertDateForSupabase(dateString) {
    const parts = dateString.split("/");

    if (parts.length !== 3) {
      return null;
    }

    const day = parts[0];
    const month = parts[1];
    const year = parts[2];

    if (
      day.length !== 2 ||
      month.length !== 2 ||
      year.length !== 4
    ) {
      return null;
    }

    const dayNumber = Number(day);
    const monthNumber = Number(month);
    const yearNumber = Number(year);

    const testDate = new Date(
      yearNumber,
      monthNumber - 1,
      dayNumber
    );

    if (
      testDate.getFullYear() !== yearNumber ||
      testDate.getMonth() !== monthNumber - 1 ||
      testDate.getDate() !== dayNumber
    ) {
      return null;
    }

    return `${year}-${month}-${day}`;
  }

  async function handleReservation() {
    if (!date || !time || !name || !phone) {
      setMessage("Completează toate câmpurile.");
      return;
    }

    const formattedDate = convertDateForSupabase(date);

    if (!formattedDate) {
      setMessage("Introdu o dată validă în format ZZ/LL/AAAA.");
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
            reservation_date: formattedDate,
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

      setMessage(
        "Rezervarea a fost trimisă cu succes! ✅"
      );

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

        <p>
          ⭐ 9.2 • Bucătărie românească
        </p>

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
          {/* DATA */}

          <input
            type="text"
            inputMode="numeric"
            placeholder="ZZ/LL/AAAA"
            value={date}
            maxLength={10}
            onChange={handleDateChange}
            style={{
              padding: "15px",
              borderRadius: "10px",
              border: "1px solid #ddd",
              fontSize: "16px",
            }}
          />

          {/* ORA */}

          <select
            value={time}
            onChange={(e) =>
              setTime(e.target.value)
            }
            style={{
              padding: "15px",
              borderRadius: "10px",
              border: "1px solid #ddd",
              fontSize: "16px",
            }}
          >
            <option value="">
              Alege ora
            </option>

            <option value="18:00">
              18:00
            </option>

            <option value="18:30">
              18:30
            </option>

            <option value="19:00">
              19:00
            </option>

            <option value="19:30">
              19:30
            </option>

            <option value="20:00">
              20:00
            </option>

            <option value="20:30">
              20:30
            </option>
          </select>

          {/* PERSOANE */}

          <select
            value={guests}
            onChange={(e) =>
              setGuests(e.target.value)
            }
            style={{
              padding: "15px",
              borderRadius: "10px",
              border: "1px solid #ddd",
              fontSize: "16px",
            }}
          >
            <option value="1">
              1 persoană
            </option>

            <option value="2">
              2 persoane
            </option>

            <option value="3">
              3 persoane
            </option>

            <option value="4">
              4 persoane
            </option>

            <option value="5">
              5 persoane
            </option>

            <option value="6">
              6 persoane
            </option>

            <option value="7">
              7 persoane
            </option>

            <option value="8">
              8 persoane
            </option>
          </select>

          {/* NUME */}

          <input
            type="text"
            placeholder="Numele tău"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            style={{
              padding: "15px",
              borderRadius: "10px",
              border: "1px solid #ddd",
              fontSize: "16px",
            }}
          />

          {/* TELEFON */}

          <input
            type="tel"
            placeholder="Număr de telefon"
            value={phone}
            onChange={(e) =>
              setPhone(e.target.value)
            }
            style={{
              padding: "15px",
              borderRadius: "10px",
              border: "1px solid #ddd",
              fontSize: "16px",
            }}
          />

          {/* BUTON */}

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
              cursor: loading
                ? "not-allowed"
                : "pointer",
              opacity: loading ? 0.7 : 1,
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
