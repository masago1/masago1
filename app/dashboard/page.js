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
  const [updatingId, setUpdatingId] = useState(null);
  const [message, setMessage] = useState("");

  const [offerDate, setOfferDate] = useState("");
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("20:00");
  const [discountPercent, setDiscountPercent] = useState("30");
  const [capacity, setCapacity] = useState("10");
  const [creatingOffer, setCreatingOffer] = useState(false);
  const [offerMessage, setOfferMessage] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const accessToken = localStorage.getItem("masago_access_token");
    const email = localStorage.getItem("masago_user_email");

    if (!accessToken) {
      window.location.href = "/login";
      return;
    }

    setUserEmail(email || "");

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      setMessage("Conexiunea cu Supabase nu este configurată.");
      setAuthChecking(false);
      setLoading(false);
      return;
    }

    try {
      const restaurant = await loadRestaurant(
        accessToken,
        supabaseUrl,
        supabaseKey
      );

      await Promise.all([
        loadReservations(
          accessToken,
          supabaseUrl,
          supabaseKey
        ),

        restaurant?.id
          ? loadOffers(
              accessToken,
              supabaseUrl,
              supabaseKey,
              restaurant.id
            )
          : Promise.resolve(),
      ]);

      if (!restaurant) {
        console.log("Restaurantul nu a fost găsit.");
      }
    } finally {
      setAuthChecking(false);
    }
  }

  async function loadRestaurant(
    accessToken,
    supabaseUrl,
    supabaseKey
  ) {
    try {
      const email = (
        localStorage.getItem("masago_user_email") || ""
      )
        .trim()
        .toLowerCase();

      let restaurantName = null;

      if (email === "costindavid719@gmail.com") {
        restaurantName = "Casa Bunicii";
      } else if (email === "vrenst24@gmail.com") {
        restaurantName = "Boom Pub";
      }

      if (!restaurantName) {
        console.error(
          "Emailul nu este asociat unui restaurant:",
          email
        );

        setMessage(
          "Acest cont nu este asociat unui restaurant."
        );

        return null;
      }

      const encodedName =
        encodeURIComponent(restaurantName);

      const response = await fetch(
        `${supabaseUrl}/rest/v1/restaurants?name=eq.${encodedName}&select=id,name&limit=1`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.status === 401) {
        handleLogout();
        return null;
      }

      const data = await response.json();

      if (!response.ok) {
        console.error("Restaurant error:", data);

        setMessage(
          "Nu am putut identifica restaurantul."
        );

        return null;
      }

      if (data?.[0]) {
        setRestaurantId(data[0].id);

        if (data[0].name) {
          setRestaurantName(data[0].name);
        }

        return data[0];
      }

      setMessage(
        `Restaurantul "${restaurantName}" nu a fost găsit.`
      );

      return null;
    } catch (error) {
      console.error(
        "Load restaurant error:",
        error
      );

      setMessage(
        "A apărut o eroare la identificarea restaurantului."
      );

      return null;
    }
  }

  async function loadReservations(
    accessToken,
    supabaseUrl,
    supabaseKey
  ) {
    try {
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
        handleLogout();
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        console.error("Reservations error:", data);

        setMessage(
          "Nu am putut încărca rezervările."
        );

        return;
      }

      setReservations(data || []);
    } catch (error) {
      console.error(error);

      setMessage(
        "A apărut o eroare la încărcarea rezervărilor."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadOffers(
    accessToken,
    supabaseUrl,
    supabaseKey,
    currentRestaurantId = restaurantId
  ) {
    if (!currentRestaurantId) return;

    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/offers?restaurant_id=eq.${currentRestaurantId}&select=*&order=offer_date.desc,start_time.desc`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.status === 401) {
        handleLogout();
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        console.error("Offers error:", data);
        setOfferMessage(
          "Nu am putut încărca ofertele."
        );
        return;
      }

      setOffers(data || []);
    } catch (error) {
      console.error("Offers error:", error);

      setOfferMessage(
        "Nu am putut încărca ofertele."
      );
    }
  }

  async function createOffer(event) {
    event.preventDefault();
    setOfferMessage("");

    if (!restaurantId) {
      setOfferMessage(
        "Restaurantul nu este identificat."
      );
      return;
    }

    if (!offerDate) {
      setOfferMessage("Alege data ofertei.");
      return;
    }

    if (!startTime || !endTime) {
      setOfferMessage(
        "Alege intervalul orar."
      );
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

    if (
      Number.isNaN(discount) ||
      discount < 1 ||
      discount > 100
    ) {
      setOfferMessage(
        "Reducerea trebuie să fie între 1% și 100%."
      );
      return;
    }

    if (
      Number.isNaN(offerCapacity) ||
      offerCapacity < 1
    ) {
      setOfferMessage(
        "Capacitatea trebuie să fie cel puțin 1."
      );
      return;
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    const accessToken =
      localStorage.getItem("masago_access_token");

    if (!accessToken) {
      window.location.href = "/login";
      return;
    }

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

      if (response.status === 401) {
        handleLogout();
        return;
      }

      if (!response.ok) {
        const errorText =
          await response.text();

        console.error(
          "Create offer error:",
          errorText
        );

        setOfferMessage(
          `Eroare la crearea ofertei: ${errorText}`
        );

        return;
      }

      setOfferMessage(
        "✓ Oferta a fost creată cu succes!"
      );

      setOfferDate("");
      setStartTime("18:00");
      setEndTime("20:00");
      setDiscountPercent("30");
      setCapacity("10");

      await loadOffers(
        accessToken,
        supabaseUrl,
        supabaseKey,
        restaurantId
      );
    } catch (error) {
      console.error(error);

      setOfferMessage(
        "A apărut o eroare la crearea ofertei."
      );
    } finally {
      setCreatingOffer(false);
    }
  }

  async function updateReservation(
    id,
    newStatus
  ) {
    setUpdatingId(id);
    setMessage("");

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    const accessToken =
      localStorage.getItem("masago_access_token");

    if (!accessToken) {
      window.location.href = "/login";
      return;
    }

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

      if (response.status === 401) {
        handleLogout();
        return;
      }

      if (!response.ok) {
        const errorText =
          await response.text();

        console.error(errorText);

        setMessage(
          "Nu am putut actualiza rezervarea."
        );

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
    } catch (error) {
      console.error(error);

      setMessage(
        "A apărut o eroare la actualizare."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  function handleLogout() {
    localStorage.removeItem(
      "masago_access_token"
    );

    localStorage.removeItem(
      "masago_refresh_token"
    );

    localStorage.removeItem(
      "masago_user_email"
    );

    window.location.href = "/login";
  }

  function formatDate(date) {
    if (!date) return "-";

    const [year, month, day] =
      date.split("-");

    return `${day}/${month}/${year}`;
  }

  function formatTime(time) {
    if (!time) return "-";

    return String(time).slice(0, 5);
  }

  function getTodayISO() {
    const now = new Date();

    const year = now.getFullYear();

    const month = String(
      now.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      now.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function getStatusLabel(status) {
    if (status === "accepted") {
      return "Confirmată";
    }

    if (status === "rejected") {
      return "Respinsă";
    }

    return "În așteptare";
  }

  function getStatusStyle(status) {
    if (status === "accepted") {
      return {
        background: "#E9F8EF",
        color: "#177245",
      };
    }

    if (status === "rejected") {
      return {
        background: "#FDECEC",
        color: "#B42318",
      };
    }

    return {
      background: "#FFF4DD",
      color: "#946200",
    };
  }

  const stats = useMemo(() => {
    const today = getTodayISO();

    return {
      today: reservations.filter(
        (reservation) =>
          reservation.reservation_date ===
          today
      ).length,

      pending: reservations.filter(
        (reservation) =>
          reservation.status === "pending"
      ).length,

      accepted: reservations.filter(
        (reservation) =>
          reservation.status === "accepted"
      ).length,

      rejected: reservations.filter(
        (reservation) =>
          reservation.status === "rejected"
      ).length,
    };
  }, [reservations]);

  if (authChecking) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#F6F7F9",
          color: "#172033",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            background: "white",
            padding: "25px 30px",
            borderRadius: "16px",
            border: "1px solid #E7E9ED",
            fontWeight: "800",
          }}
        >
          Se verifică autentificarea...
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F6F7F9",
        fontFamily: "Arial, sans-serif",
        color: "#172033",
      }}
    >
      {/* HEADER */}

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
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <a
            href="/"
            style={{
              color: "white",
              textDecoration: "none",
              fontWeight: "900",
              fontSize: "28px",
              letterSpacing: "-1px",
            }}
          >
            Masago
            <span style={{ color: "#FF5A3C" }}>
              .
            </span>
          </a>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            {userEmail && (
              <span
                style={{
                  color: "#BCC5D3",
                  fontSize: "14px",
                }}
              >
                {userEmail}
              </span>
            )}

            <button
              onClick={handleLogout}
              style={{
                border: "1px solid #3A465D",
                background: "#202C43",
                color: "white",
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
          margin: "0 auto",
          padding: "42px 5% 70px",
        }}
      >
        {/* INTRO */}

        <section
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "end",
            gap: "25px",
            flexWrap: "wrap",
            marginBottom: "30px",
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                color: "#FF5A3C",
                textTransform: "uppercase",
                letterSpacing: "1px",
                fontSize: "13px",
                fontWeight: "900",
              }}
            >
              Dashboard restaurant
            </p>

            <h1
              style={{
                margin: "8px 0 8px",
                fontSize: "42px",
                letterSpacing: "-1.5px",
              }}
            >
              Bun venit, {restaurantName}
            </h1>

            <p
              style={{
                margin: 0,
                color: "#737C8D",
                fontSize: "17px",
              }}
            >
              Gestionează rezervările și confirmă solicitările clienților.
            </p>
          </div>

          <a
            href="/"
            style={{
              textDecoration: "none",
              color: "#172033",
              background: "white",
              border: "1px solid #E2E5E9",
              padding: "12px 16px",
              borderRadius: "10px",
              fontWeight: "800",
            }}
          >
            ← Vezi aplicația
          </a>
        </section>

        {/* STATISTICI */}

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(190px, 1fr))",
            gap: "16px",
            marginBottom: "35px",
          }}
        >
          {[
            {
              label: "Rezervări azi",
              value: stats.today,
              icon: "📅",
            },
            {
              label: "În așteptare",
              value: stats.pending,
              icon: "⏳",
            },
            {
              label: "Confirmate",
              value: stats.accepted,
              icon: "✅",
            },
            {
              label: "Respinse",
              value: stats.rejected,
              icon: "❌",
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: "white",
                border: "1px solid #E7E9ED",
                borderRadius: "18px",
                padding: "22px",
                boxShadow:
                  "0 8px 25px rgba(23,32,51,0.04)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    color: "#737C8D",
                    fontWeight: "700",
                    fontSize: "14px",
                  }}
                >
                  {item.label}
                </span>

                <span
                  style={{
                    fontSize: "21px",
                  }}
                >
                  {item.icon}
                </span>
              </div>

              <div
                style={{
                  marginTop: "12px",
                  fontSize: "36px",
                  fontWeight: "900",
                }}
              >
                {item.value}
              </div>
            </div>
          ))}
        </section>

        {/* OFERTE */}

        <section
          style={{
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "15px",
              marginBottom: "20px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "28px",
                }}
              >
                Oferte
              </h2>

              <p
                style={{
                  margin: "6px 0 0",
                  color: "#818997",
                }}
              >
                Creează reduceri pentru intervalele în care vrei mai mulți clienți.
              </p>
            </div>

            <div
              style={{
                background: "#FF5A3C",
                color: "white",
                borderRadius: "999px",
                padding: "9px 14px",
                fontWeight: "800",
                fontSize: "13px",
              }}
            >
              {offers.length} oferte
            </div>
          </div>

          <div
            style={{
              background: "white",
              border: "1px solid #E7E9ED",
              borderRadius: "20px",
              padding: "24px",
              boxShadow:
                "0 8px 25px rgba(23,32,51,0.045)",
            }}
          >
            <div
              style={{
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  color: "#FF5A3C",
                  fontSize: "12px",
                  fontWeight: "900",
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                  marginBottom: "6px",
                }}
              >
                Ofertă nouă
              </div>

              <h3
                style={{
                  margin: 0,
                  fontSize: "22px",
                }}
              >
                Creează ofertă
              </h3>
            </div>

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
                  <label style={formLabel}>
                    Data
                  </label>

                  <input
                    type="date"
                    min={getTodayISO()}
                    value={offerDate}
                    onChange={(event) =>
                      setOfferDate(
                        event.target.value
                      )
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
                    onChange={(event) =>
                      setStartTime(
                        event.target.value
                      )
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
                    onChange={(event) =>
                      setEndTime(
                        event.target.value
                      )
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
                    onChange={(event) =>
                      setDiscountPercent(
                        event.target.value
                      )
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
                    onChange={(event) =>
                      setCapacity(
                        event.target.value
                      )
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
                  border: "none",
                  borderRadius: "11px",
                  padding: "14px 18px",
                  marginTop: "20px",
                  background: creatingOffer
                    ? "#AEB5C0"
                    : "#FF5A3C",
                  color: "white",
                  fontSize: "15px",
                  fontWeight: "900",
                  cursor: creatingOffer
                    ? "not-allowed"
                    : "pointer",
                  opacity: creatingOffer
                    ? 0.7
                    : 1,
                }}
              >
                {creatingOffer
                  ? "Se creează..."
                  : "+ Creează oferta"}
              </button>
            </form>

            {offerMessage && (
              <div
                style={{
                  marginTop: "15px",
                  padding: "13px 15px",
                  borderRadius: "11px",
                  background:
                    offerMessage.startsWith("✓")
                      ? "#E9F8EF"
                      : "#FFF0EC",
                  color:
                    offerMessage.startsWith("✓")
                      ? "#177245"
                      : "#A33A29",
                  fontWeight: "800",
                  fontSize: "14px",
                  wordBreak: "break-word",
                }}
              >
                {offerMessage}
              </div>
            )}
          </div>

          {offers.length > 0 && (
            <div
              style={{
                display: "grid",
                gap: "12px",
                marginTop: "16px",
              }}
            >
              {offers.map((offer) => (
                <div
                  key={offer.id}
                  style={{
                    background: "white",
                    border:
                      "1px solid #E7E9ED",
                    borderRadius: "16px",
                    padding: "18px 20px",
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "center",
                    gap: "15px",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#8A92A0",
                        fontWeight: "800",
                        textTransform:
                          "uppercase",
                        marginBottom: "5px",
                      }}
                    >
                      {formatDate(
                        offer.offer_date
                      )}
                    </div>

                    <strong
                      style={{
                        fontSize: "17px",
                      }}
                    >
                      {formatTime(
                        offer.start_time
                      )}{" "}
                      -{" "}
                      {formatTime(
                        offer.end_time
                      )}
                    </strong>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        background: "#FFF0EC",
                        color: "#D7462D",
                        borderRadius: "999px",
                        padding: "8px 12px",
                        fontWeight: "900",
                      }}
                    >
                      -
                      {offer.discount_percent}
                      %
                    </span>

                    <span
                      style={{
                        background: "#F1F3F6",
                        color: "#485267",
                        borderRadius: "999px",
                        padding: "8px 12px",
                        fontWeight: "800",
                        fontSize: "13px",
                      }}
                    >
                      {offer.capacity} locuri
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* REZERVARI */}

        <section>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "15px",
              marginBottom: "20px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "28px",
                }}
              >
                Rezervări
              </h2>

              <p
                style={{
                  margin: "6px 0 0",
                  color: "#818997",
                }}
              >
                Cele mai noi rezervări apar primele.
              </p>
            </div>

            <div
              style={{
                background: "#172033",
                color: "white",
                borderRadius: "999px",
                padding: "9px 14px",
                fontWeight: "800",
                fontSize: "13px",
              }}
            >
              {reservations.length} total
            </div>
          </div>

          {message && (
            <div
              style={{
                background: "#FFF0EC",
                border:
                  "1px solid #FFD8CF",
                color: "#A33A29",
                padding: "15px",
                borderRadius: "12px",
                marginBottom: "18px",
                fontWeight: "700",
              }}
            >
              {message}
            </div>
          )}

          {loading && (
            <div
              style={{
                background: "white",
                border:
                  "1px solid #E7E9ED",
                borderRadius: "18px",
                padding: "30px",
              }}
            >
              Se încarcă rezervările...
            </div>
          )}

          {!loading &&
            reservations.length === 0 && (
              <div
                style={{
                  background: "white",
                  border:
                    "1px solid #E7E9ED",
                  borderRadius: "18px",
                  padding: "45px 30px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "40px",
                    marginBottom: "12px",
                  }}
                >
                  📭
                </div>

                <h3>
                  Nu există rezervări momentan
                </h3>

                <p
                  style={{
                    color: "#818997",
                  }}
                >
                  Rezervările noi vor apărea aici.
                </p>
              </div>
            )}

          <div
            style={{
              display: "grid",
              gap: "18px",
            }}
          >
            {reservations.map(
              (reservation) => {
                const statusStyle =
                  getStatusStyle(
                    reservation.status
                  );

                return (
                  <article
                    key={reservation.id}
                    style={{
                      background: "white",
                      border:
                        "1px solid #E7E9ED",
                      borderRadius: "20px",
                      padding: "24px",
                      boxShadow:
                        "0 8px 25px rgba(23,32,51,0.045)",
                    }}
                  >
                    {/* COD + STATUS */}

                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems: "center",
                        gap: "15px",
                        flexWrap: "wrap",
                        marginBottom: "22px",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#8A92A0",
                            fontWeight: "800",
                            textTransform:
                              "uppercase",
                            letterSpacing:
                              "0.8px",
                            marginBottom:
                              "6px",
                          }}
                        >
                          Cod rezervare
                        </div>

                        <div
                          style={{
                            display:
                              "inline-block",
                            background:
                              "#172033",
                            color: "white",
                            borderRadius:
                              "10px",
                            padding:
                              "10px 14px",
                            fontSize: "15px",
                            fontWeight:
                              "900",
                            letterSpacing:
                              "1.2px",
                          }}
                        >
                          {reservation.reservation_code ||
                            "FĂRĂ COD"}
                        </div>
                      </div>

                      <div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#8A92A0",
                            fontWeight: "800",
                            textTransform:
                              "uppercase",
                            letterSpacing:
                              "0.8px",
                            marginBottom:
                              "6px",
                          }}
                        >
                          Status
                        </div>

                        <span
                          style={{
                            display:
                              "inline-block",
                            padding:
                              "9px 13px",
                            borderRadius:
                              "999px",
                            fontSize: "13px",
                            fontWeight:
                              "900",
                            ...statusStyle,
                          }}
                        >
                          {getStatusLabel(
                            reservation.status
                          )}
                        </span>
                      </div>
                    </div>

                    {/* DATE REZERVARE */}

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(140px, 1fr))",
                        gap: "20px",
                      }}
                    >
                      <div>
                        <div
                          style={smallLabel}
                        >
                          Client
                        </div>

                        <strong
                          style={{
                            fontSize: "17px",
                          }}
                        >
                          {reservation.customer_name ||
                            "-"}
                        </strong>
                      </div>

                      <div>
                        <div
                          style={smallLabel}
                        >
                          Telefon
                        </div>

                        <strong>
                          {reservation.customer_phone ||
                            "-"}
                        </strong>
                      </div>

                      <div>
                        <div
                          style={smallLabel}
                        >
                          Data
                        </div>

                        <strong>
                          {formatDate(
                            reservation.reservation_date
                          )}
                        </strong>
                      </div>

                      <div>
                        <div
                          style={smallLabel}
                        >
                          Ora
                        </div>

                        <strong>
                          {formatTime(
                            reservation.reservation_time
                          )}
                        </strong>
                      </div>

                      <div>
                        <div
                          style={smallLabel}
                        >
                          Persoane
                        </div>

                        <strong>
                          {reservation.guests ??
                            "-"}
                        </strong>
                      </div>
                    </div>

                    {/* BUTOANE */}

                    {reservation.status ===
                      "pending" && (
                      <div
                        style={{
                          marginTop: "22px",
                          paddingTop: "20px",
                          borderTop:
                            "1px solid #EEF0F2",
                          display: "flex",
                          gap: "10px",
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          onClick={() =>
                            updateReservation(
                              reservation.id,
                              "accepted"
                            )
                          }
                          disabled={
                            updatingId ===
                            reservation.id
                          }
                          style={{
                            flex:
                              "1 1 200px",
                            border: "none",
                            borderRadius:
                              "11px",
                            padding:
                              "13px 15px",
                            background:
                              "#16865C",
                            color: "white",
                            fontWeight:
                              "900",
                            cursor:
                              updatingId ===
                              reservation.id
                                ? "not-allowed"
                                : "pointer",
                            opacity:
                              updatingId ===
                              reservation.id
                                ? 0.6
                                : 1,
                          }}
                        >
                          {updatingId ===
                          reservation.id
                            ? "Se actualizează..."
                            : "✓ Acceptă rezervarea"}
                        </button>

                        <button
                          onClick={() =>
                            updateReservation(
                              reservation.id,
                              "rejected"
                            )
                          }
                          disabled={
                            updatingId ===
                            reservation.id
                          }
                          style={{
                            flex:
                              "1 1 200px",
                            border:
                              "1px solid #E1E4E8",
                            borderRadius:
                              "11px",
                            padding:
                              "13px 15px",
                            background:
                              "white",
                            color:
                              "#B42318",
                            fontWeight:
                              "900",
                            cursor:
                              updatingId ===
                              reservation.id
                                ? "not-allowed"
                                : "pointer",
                            opacity:
                              updatingId ===
                              reservation.id
                                ? 0.6
                                : 1,
                          }}
                        >
                          Respinge
                        </button>
                      </div>
                    )}
                  </article>
                );
              }
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

const smallLabel = {
  fontSize: "11px",
  color: "#8A92A0",
  marginBottom: "6px",
  fontWeight: "800",
  textTransform: "uppercase",
  letterSpacing: "0.6px",
};

const formLabel = {
  display: "block",
  fontSize: "12px",
  color: "#657084",
  marginBottom: "7px",
  fontWeight: "800",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const formInput = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #DDE1E6",
  borderRadius: "11px",
  padding: "13px 14px",
  background: "#FAFBFC",
  color: "#172033",
  fontSize: "15px",
  outline: "none",
};
