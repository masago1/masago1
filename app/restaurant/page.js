"use client";

import { useState } from "react";

export default function RestaurantPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [selectedDate, setSelectedDate] = useState(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const [calendarMonth, setCalendarMonth] = useState(
    today.getMonth()
  );
  const [calendarYear, setCalendarYear] = useState(
    today.getFullYear()
  );

  const [time, setTime] = useState("");
  const [guests, setGuests] = useState("2");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const monthNames = [
    "Ianuarie",
    "Februarie",
    "Martie",
    "Aprilie",
    "Mai",
    "Iunie",
    "Iulie",
    "August",
    "Septembrie",
    "Octombrie",
    "Noiembrie",
    "Decembrie",
  ];

  const weekDays = [
    "Lu",
    "Ma",
    "Mi",
    "Jo",
    "Vi",
    "Sâ",
    "Du",
  ];

  function formatDateDisplay(date) {
    if (!date) return "";

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }

  function formatDateSupabase(date) {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${year}-${month}-${day}`;
  }

  function getCalendarDays() {
    const firstDay = new Date(
      calendarYear,
      calendarMonth,
      1
    );

    const lastDay = new Date(
      calendarYear,
      calendarMonth + 1,
      0
    );

    const numberOfDays = lastDay.getDate();

    let firstDayIndex = firstDay.getDay();

    // Transformăm:
    // Duminică = 0 în JS
    // în calendarul nostru Luni = 0
    firstDayIndex =
      firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const days = [];

    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }

    for (let day = 1; day <= numberOfDays; day++) {
      days.push(day);
    }

    return days;
  }

  function previousMonth() {
    let newMonth = calendarMonth - 1;
    let newYear = calendarYear;

    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    }

    const firstOfNewMonth = new Date(
      newYear,
      newMonth,
      1
    );

    const firstOfCurrentMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );

    if (firstOfNewMonth < firstOfCurrentMonth) {
      return;
    }

    setCalendarMonth(newMonth);
    setCalendarYear(newYear);
  }

  function nextMonth() {
    let newMonth = calendarMonth + 1;
    let newYear = calendarYear;

    if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }

    setCalendarMonth(newMonth);
    setCalendarYear(newYear);
  }

  function selectDay(day) {
    const date = new Date(
      calendarYear,
      calendarMonth,
      day
    );

    date.setHours(0, 0, 0, 0);

    if (date < today) {
      return;
    }

    setSelectedDate(date);
    setCalendarOpen(false);
    setMessage("");
  }

  function isPastDay(day) {
    if (!day) return false;

    const date = new Date(
      calendarYear,
      calendarMonth,
      day
    );

    date.setHours(0, 0, 0, 0);

    return date < today;
  }

  function isSelectedDay(day) {
    if (!selectedDate || !day) return false;

    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === calendarMonth &&
      selectedDate.getFullYear() === calendarYear
    );
  }

  async function handleReservation() {
    if (
      !selectedDate ||
      !time ||
      !name.trim() ||
      !phone.trim()
    ) {
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
        setMessage(
          "Conexiunea cu baza de date nu este configurată."
        );
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
            reservation_date:
              formatDateSupabase(selectedDate),
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

        console.error(errorText);

        setMessage(
          "A apărut o eroare la rezervare."
        );

        return;
      }

      setMessage(
        "Rezervarea a fost trimisă cu succes! ✅"
      );

      setSelectedDate(null);
      setTime("");
      setGuests("2");
      setName("");
      setPhone("");
    } catch (error) {
      console.error(error);

      setMessage(
        "A apărut o eroare la rezervare."
      );
    } finally {
      setLoading(false);
    }
  }

  const calendarDays = getCalendarDays();

  const fieldStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "15px",
    borderRadius: "10px",
    border: "1px solid #ddd",
    fontSize: "16px",
    background: "white",
  };

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
          boxShadow:
            "0 8px 30px rgba(0,0,0,0.08)",
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

          <label
            style={{
              fontWeight: "bold",
            }}
          >
            Data rezervării
          </label>

          <div
            style={{
              position: "relative",
            }}
          >
            <button
              type="button"
              onClick={() =>
                setCalendarOpen(!calendarOpen)
              }
              style={{
                ...fieldStyle,
                textAlign: "left",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                color: selectedDate
                  ? "#222"
                  : "#777",
              }}
            >
              <span>
                {selectedDate
                  ? formatDateDisplay(selectedDate)
                  : "ZZ/LL/AAAA"}
              </span>

              <span style={{ fontSize: "20px" }}>
                📅
              </span>
            </button>

            {calendarOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "60px",
                  left: 0,
                  width: "320px",
                  maxWidth: "100%",
                  background: "white",
                  borderRadius: "15px",
                  padding: "18px",
                  boxShadow:
                    "0 10px 35px rgba(0,0,0,0.18)",
                  border: "1px solid #eee",
                  zIndex: 100,
                }}
              >
                {/* HEADER CALENDAR */}

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "center",
                    marginBottom: "18px",
                  }}
                >
                  <button
                    type="button"
                    onClick={previousMonth}
                    style={{
                      border: "none",
                      background: "#f3f3f3",
                      width: "38px",
                      height: "38px",
                      borderRadius: "10px",
                      cursor: "pointer",
                      fontSize: "20px",
                    }}
                  >
                    ‹
                  </button>

                  <strong
                    style={{
                      fontSize: "17px",
                    }}
                  >
                    {monthNames[calendarMonth]}{" "}
                    {calendarYear}
                  </strong>

                  <button
                    type="button"
                    onClick={nextMonth}
                    style={{
                      border: "none",
                      background: "#f3f3f3",
                      width: "38px",
                      height: "38px",
                      borderRadius: "10px",
                      cursor: "pointer",
                      fontSize: "20px",
                    }}
                  >
                    ›
                  </button>
                </div>

                {/* ZILE SAPTAMANA */}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(7, 1fr)",
                    gap: "5px",
                    marginBottom: "8px",
                  }}
                >
                  {weekDays.map((weekDay) => (
                    <div
                      key={weekDay}
                      style={{
                        textAlign: "center",
                        fontSize: "12px",
                        fontWeight: "bold",
                        color: "#888",
                      }}
                    >
                      {weekDay}
                    </div>
                  ))}
                </div>

                {/* ZILE CALENDAR */}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(7, 1fr)",
                    gap: "5px",
                  }}
                >
                  {calendarDays.map(
                    (day, index) => {
                      if (!day) {
                        return (
                          <div
                            key={`empty-${index}`}
                          />
                        );
                      }

                      const past =
                        isPastDay(day);

                      const selected =
                        isSelectedDay(day);

                      return (
                        <button
                          type="button"
                          key={day}
                          disabled={past}
                          onClick={() =>
                            selectDay(day)
                          }
                          style={{
                            border: "none",
                            height: "38px",
                            borderRadius:
                              "10px",
                            cursor: past
                              ? "not-allowed"
                              : "pointer",
                            background: selected
                              ? "#ff5a3c"
                              : "#f7f7f7",
                            color: selected
                              ? "white"
                              : past
                              ? "#bbb"
                              : "#222",
                            fontWeight: selected
                              ? "bold"
                              : "normal",
                            opacity: past
                              ? 0.55
                              : 1,
                          }}
                        >
                          {day}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ORA */}

          <label
            style={{
              fontWeight: "bold",
            }}
          >
            Ora
          </label>

          <select
            value={time}
            onChange={(e) =>
              setTime(e.target.value)
            }
            style={fieldStyle}
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

            <option value="21:00">
              21:00
            </option>
          </select>

          {/* PERSOANE */}

          <label
            style={{
              fontWeight: "bold",
            }}
          >
            Număr de persoane
          </label>

          <select
            value={guests}
            onChange={(e) =>
              setGuests(e.target.value)
            }
            style={fieldStyle}
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

          <label
            style={{
              fontWeight: "bold",
            }}
          >
            Nume
          </label>

          <input
            type="text"
            placeholder="Numele tău"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            style={fieldStyle}
          />

          {/* TELEFON */}

          <label
            style={{
              fontWeight: "bold",
            }}
          >
            Număr de telefon
          </label>

          <input
            type="tel"
            placeholder="07xx xxx xxx"
            value={phone}
            onChange={(e) =>
              setPhone(e.target.value)
            }
            style={fieldStyle}
          />

          {/* REZERVARE */}

          <button
            type="button"
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
