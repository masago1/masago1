"use client";

import { useEffect, useMemo, useState } from "react";

export default function DashboardPage() {
  const [reservations, setReservations] = useState([]);
  const [offers, setOffers] = useState([]);

  const [restaurantName, setRestaurantName] = useState("Restaurant");
  const [restaurantId, setRestaurantId] = useState(null);
  const [userEmail, setUserEmail] = useState("");

  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);

  const [message, setMessage] = useState("");
  const [offerMessage, setOfferMessage] = useState("");

  const [updatingId, setUpdatingId] = useState(null);
  const [creatingOffer, setCreatingOffer] = useState(false);

  const [offerDate, setOfferDate] = useState("");
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("20:00");
  const [discountPercent, setDiscountPercent] = useState("30");
  const [capacity, setCapacity] = useState("10");

  useEffect(() => {
    startDashboard();
  }, []);

  async function startDashboard() {
    const accessToken = localStorage.getItem("masago_access_token");
    const email = localStorage.getItem("masago_user_email");

    if (!accessToken) {
      window.location.href = "/login";
      return;
    }

    setUserEmail(email || "");

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      setMessage("Conexiunea cu Supabase nu este configurată.");
      setAuthChecking(false);
      setLoading(false);
      return;
    }

    try {
      const restaurantResponse = await fetch(
        `${supabaseUrl}/rest/v1/restaurants?select=id,name&limit=1`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (restaurantResponse.status === 401) {
        logout();
        return;
      }

      const restaurantData = await restaurantResponse.json();

      if (
        !restaurantResponse.ok ||
        !restaurantData ||
        restaurantData.length === 0
      ) {
        setMessage("Nu am găsit restaurantul asociat contului.");
        return;
      }

      const restaurant = restaurantData[0];

      setRestaurantId(restaurant.id);
      setRestaurantName(restaurant.name);

      await Promise.all([
        loadReservations(accessToken),
        loadOffers(accessToken),
      ]);
    } catch (error) {
      console.error(error);
      setMessage("A apărut o eroare la încărcarea dashboard-ului.");
    } finally {
      setAuthChecking(false);
      setLoading(false);
    }
  }

  async function loadReservations(accessToken) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    const response = await fetch(
      `${supabaseUrl}/rest/v1/reservations?select=*&order=id.desc`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (response.status === 401) {
      logout();
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      setMessage("Nu am putut încărca rezervările.");
      return;
    }

    setReservations(data);
  }

  async function loadOffers(accessToken) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    const response = await fetch(
      `${supabaseUrl}/rest/v1/offers?select=*&order=offer_date.asc,start_time.asc`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (response.status === 401) {
      logout();
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      setOfferMessage("Nu am putut încărca ofertele.");
      return;
    }

    setOffers(data);
  }

  async function createOffer(event) {
    event.preventDefault();
    setOfferMessage("");

    if (!restaurantId) {
      setOfferMessage("Restaurantul nu este identificat.");
      return;
    }

    if (!offerDate) {
      setOfferMessage("Alege data ofertei.");
      return;
    }

    if (!startTime || !endTime) {
      setOfferMessage("Completează intervalul orar.");
      return;
    }

    if (endTime <= startTime) {
      setOfferMessage(
        "Ora de final trebuie să fie după ora de început."
      );
      return;
    }

    const discount = Number(discountPercent);
    const offerCapacity = Number(capacity);

    if (discount < 1 || discount > 100) {
      setOfferMessage("Reducerea trebuie să fie între 1% și 100%.");
      return;
    }

    if (offerCapacity < 1) {
      setOfferMessage("Capacitatea trebuie să fie cel puțin 1.");
      return;
    }

    const accessToken = localStorage.getItem("masago_access_token");

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    setCreatingOffer(true);

    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/offers`,
        {
          method: "POST",

          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },

          body: JSON.stringify({
            restaurant_id: restaurantId,
            offer_date: offerDate,
            start_time: startTime,
            end_time: endTime,
            discount_percent: discount,
            capacity: offerCapacity,
            active: true,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(errorText);
        setOfferMessage(`Eroare ofertă: ${errorText}`);
        return;
      }

      setOfferMessage("✅ Oferta a fost creată!");

      setOfferDate("");
      setStartTime("18:00");
      setEndTime("20:00");
      setDiscountPercent("30");
      setCapacity("10");

      await loadOffers(accessToken);
    } catch (error) {
      console.error(error);
      setOfferMessage("A apărut o eroare la crearea ofertei.");
    } finally {
      setCreatingOffer(false);
    }
  }

  async function updateReservation(id, newStatus) {
    setUpdatingId(id);

    const accessToken = localStorage.getItem("masago_access_token");

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/reservations?id=eq.${id}`,
        {
          method: "PATCH",

          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },

          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      if (!response.ok) {
        const text = await response.text();
        console.error(text);
        setMessage("Nu am putut actualiza rezervarea.");
        return;
      }

      setReservations((current) =>
        current.map((reservation) =>
          reservation.id === id
            ? {
                ...reservation,
                status: newStatus,
              }
            : reservation
        )
      );
    } finally {
      setUpdatingId(null);
    }
  }

  function logout() {
    localStorage.removeItem("masago_access_token");
    localStorage.removeItem("masago_refresh_token");
    localStorage.removeItem("masago_user_email");

    window.location.href = "/login";
  }

  function formatDate(date) {
    if (!date) return "-";

    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year}`;
  }

  function formatTime(time) {
    if (!time) return "-";
    return String(time).slice(0, 5);
  }

  function todayISO() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function statusLabel(status) {
    if (status === "accepted") return "Confirmată";
    if (status === "rejected") return "Respinsă";

    return "În așteptare";
  }

  const stats = useMemo(() => {
    return {
      today: reservations.filter(
        (r) => r.reservation_date === todayISO()
      ).length,

      pending: reservations.filter(
        (r) => r.status === "pending"
      ).length,

      accepted: reservations.filter(
        (r) => r.status === "accepted"
      ).length,

      offers: offers.filter(
        (offer) => offer.active
      ).length,
    };
  }, [reservations, offers]);

  if (authChecking) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Arial",
        }}
      >
        Se verifică autentificarea...
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F6F7F9",
        color: "#172033",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <header
        style={{
          background: "#172033",
          color: "white",
          padding: "18px 5%",
        }}
      >
        <div
          style={{
            maxWidth: "1250px",
            margin: "auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <strong
            style={{
              fontSize: "28px",
            }}
          >
            Masago
            <span style={{ color: "#FF5A3C" }}>.</span>
          </strong>

          <div
            style={{
              display: "flex",
              gap: "15px",
              alignItems: "center",
            }}
          >
            <span
              style={{
                color: "#BCC5D3",
                fontSize: "14px",
              }}
            >
              {userEmail}
            </span>

            <button
              onClick={logout}
              style={{
                background: "#202C43",
                color: "white",
                border: "1px solid #3A465D",
                borderRadius: "10px",
                padding: "10px 15px",
                fontWeight: "800",
                cursor: "pointer",
              }}
            >
              Deconectare
            </button>
          </div>
        </div>
      </header>

      <div
        style={{
          maxWidth: "1250px",
          margin: "auto",
          padding: "45px 5% 80px",
        }}
      >
        <p
          style={{
            color: "#FF5A3C",
            fontWeight: "900",
            margin: 0,
          }}
        >
          DASHBOARD RESTAURANT
        </p>

        <h1
          style={{
            fontSize: "42px",
            margin: "8px 0",
          }}
        >
          Bun venit, {restaurantName}
        </h1>

        <p
          style={{
            color: "#737C8D",
            fontSize: "17px",
          }}
        >
          Gestionează rezervările și ofertele restaurantului.
        </p>

        {/* STATISTICI */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "15px",
            margin: "32px 0 45px",
          }}
        >
          {[
            ["Rezervări azi", stats.today, "📅"],
            ["În așteptare", stats.pending, "⏳"],
            ["Confirmate", stats.accepted, "✅"],
            ["Oferte active", stats.offers, "🏷️"],
          ].map(([label, value, icon]) => (
            <div
              key={label}
              style={{
                background: "white",
                padding: "22px",
                borderRadius: "18px",
                border: "1px solid #E7E9ED",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: "#737C8D",
                  fontWeight: "700",
                }}
              >
                {label}
                <span>{icon}</span>
              </div>

              <div
                style={{
                  fontSize: "36px",
                  fontWeight: "900",
                  marginTop: "12px",
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* AICI ESTE BUTONUL / FORMULARUL NOU */}

        <section
          style={{
            marginBottom: "50px",
          }}
        >
          <p
            style={{
              color: "#FF5A3C",
              fontWeight: "900",
              marginBottom: "5px",
            }}
          >
            OFERTE MASAGO
          </p>

          <h2
            style={{
              fontSize: "30px",
              marginTop: 0,
            }}
          >
            Creează o ofertă
          </h2>

          <div
            style={{
              background: "white",
              padding: "25px",
              borderRadius: "20px",
              border: "1px solid #E7E9ED",
            }}
          >
            <form onSubmit={createOffer}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(160px, 1fr))",
                  gap: "15px",
                }}
              >
                <div>
                  <label style={formLabel}>Data</label>

                  <input
                    type="date"
                    min={todayISO()}
                    value={offerDate}
                    onChange={(e) =>
                      setOfferDate(e.target.value)
                    }
                    style={formInput}
                  />
                </div>

                <div>
                  <label style={formLabel}>
                    De la
                  </label>

                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) =>
                      setStartTime(e.target.value)
                    }
                    style={formInput}
                  />
                </div>

                <div>
                  <label style={formLabel}>
                    Până la
                  </label>

                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) =>
                      setEndTime(e.target.value)
                    }
                    style={formInput}
                  />
                </div>

                <div>
                  <label style={formLabel}>
                    Reducere %
                  </label>

                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={discountPercent}
                    onChange={(e) =>
                      setDiscountPercent(e.target.value)
                    }
                    style={formInput}
                  />
                </div>

                <div>
                  <label style={formLabel}>
                    Capacitate
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={capacity}
                    onChange={(e) =>
                      setCapacity(e.target.value)
                    }
                    style={formInput}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={creatingOffer}
                style={{
                  width: "100%",
                  marginTop: "20px",
                  padding: "15px",
                  border: "none",
                  borderRadius: "12px",
                  background: creatingOffer
                    ? "#AAA"
                    : "#FF5A3C",
                  color: "white",
                  fontWeight: "900",
                  fontSize: "16px",
                  cursor: "pointer",
                }}
              >
                {creatingOffer
                  ? "Se creează..."
                  : "＋ Creează oferta"}
              </button>
            </form>

            {offerMessage && (
              <div
                style={{
                  marginTop: "15px",
                  padding: "13px",
                  borderRadius: "10px",
                  background: offerMessage.includes("✅")
                    ? "#E9F8EF"
                    : "#FFF0EC",
                  color: offerMessage.includes("✅")
                    ? "#177245"
                    : "#A33A29",
                  fontWeight: "800",
                }}
              >
                {offerMessage}
              </div>
            )}
          </div>

          <h3
            style={{
              marginTop: "30px",
            }}
          >
            Ofertele tale
          </h3>

          {offers.length === 0 ? (
            <div
              style={{
                background: "white",
                padding: "25px",
                borderRadius: "15px",
                color: "#737C8D",
              }}
            >
              Nu ai creat încă nicio ofertă.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: "12px",
              }}
            >
              {offers.map((offer) => (
                <div
                  key={offer.id}
                  style={{
                    background: "white",
                    padding: "20px",
                    borderRadius: "15px",
                    border: "1px solid #E7E9ED",
                  }}
                >
                  <strong>
                    {formatDate(offer.offer_date)}
                  </strong>

                  <span>
                    {" "}
                    • {formatTime(offer.start_time)}–
                    {formatTime(offer.end_time)}
                  </span>

                  <strong
                    style={{
                      color: "#FF5A3C",
                      marginLeft: "15px",
                    }}
                  >
                    -{offer.discount_percent}%
                  </strong>

                  <span
                    style={{
                      marginLeft: "15px",
                    }}
                  >
                    Capacitate: {offer.capacity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* REZERVARI */}

        <h2
          style={{
            fontSize: "30px",
          }}
        >
          Rezervări
        </h2>

        {message && (
          <div
            style={{
              background: "#FFF0EC",
              padding: "14px",
              borderRadius: "10px",
              color: "#A33A29",
              marginBottom: "15px",
            }}
          >
            {message}
          </div>
        )}

        {loading && <p>Se încarcă...</p>}

        <div
          style={{
            display: "grid",
            gap: "16px",
          }}
        >
          {reservations.map((reservation) => (
            <div
              key={reservation.id}
              style={{
                background: "white",
                borderRadius: "18px",
                padding: "22px",
                border: "1px solid #E7E9ED",
              }}
            >
              <div
                style={{
                  background: "#172033",
                  color: "white",
                  display: "inline-block",
                  padding: "8px 12px",
                  borderRadius: "9px",
                  fontWeight: "900",
                  marginBottom: "15px",
                }}
              >
                {reservation.reservation_code || "FĂRĂ COD"}
              </div>

              <div>
                <strong>
                  {reservation.customer_name}
                </strong>

                {" • "}

                {formatDate(
                  reservation.reservation_date
                )}

                {" • "}

                {formatTime(
                  reservation.reservation_time
                )}

                {" • "}

                {reservation.guests} persoane
              </div>

              <p>
                Status:{" "}
                <strong>
                  {statusLabel(reservation.status)}
                </strong>
              </p>

              {reservation.status === "pending" && (
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                  }}
                >
                  <button
                    onClick={() =>
                      updateReservation(
                        reservation.id,
                        "accepted"
                      )
                    }
                    disabled={updatingId === reservation.id}
                    style={{
                      flex: 1,
                      border: "none",
                      padding: "12px",
                      borderRadius: "10px",
                      background: "#16865C",
                      color: "white",
                      fontWeight: "900",
                    }}
                  >
                    ✓ Acceptă
                  </button>

                  <button
                    onClick={() =>
                      updateReservation(
                        reservation.id,
                        "rejected"
                      )
                    }
                    disabled={updatingId === reservation.id}
                    style={{
                      flex: 1,
                      border: "1px solid #DDD",
                      padding: "12px",
                      borderRadius: "10px",
                      background: "white",
                      color: "#B42318",
                      fontWeight: "900",
                    }}
                  >
                    Respinge
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

const formLabel = {
  display: "block",
  marginBottom: "7px",
  fontSize: "13px",
  fontWeight: "800",
};

const formInput = {
  width: "100%",
  boxSizing: "border-box",
  padding: "13px",
  border: "1px solid #DDE1E6",
  borderRadius: "10px",
  fontSize: "15px",
};
