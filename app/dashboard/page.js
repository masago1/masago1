"use client";

import { useEffect, useMemo, useState } from "react";

export default function DashboardPage() {
  const [reservations, setReservations] = useState([]);
  const [offers, setOffers] = useState([]);

  const [restaurantName, setRestaurantName] =
    useState("Restaurant");

  const [restaurantId, setRestaurantId] =
    useState(null);

  const [userEmail, setUserEmail] = useState("");

  const [loading, setLoading] = useState(true);
  const [offersLoading, setOffersLoading] =
    useState(true);

  const [authChecking, setAuthChecking] =
    useState(true);

  const [updatingId, setUpdatingId] =
    useState(null);

  const [offerUpdatingId, setOfferUpdatingId] =
    useState(null);

  const [message, setMessage] = useState("");
  const [offerMessage, setOfferMessage] =
    useState("");

  const [creatingOffer, setCreatingOffer] =
    useState(false);

  // FORMULAR OFERTA
  const [offerDate, setOfferDate] =
    useState("");

  const [startTime, setStartTime] =
    useState("18:00");

  const [endTime, setEndTime] =
    useState("20:00");

  const [discountPercent, setDiscountPercent] =
    useState("20");

  const [capacity, setCapacity] =
    useState("10");

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const accessToken =
      localStorage.getItem("masago_access_token");

    const email =
      localStorage.getItem("masago_user_email");

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
      setMessage(
        "Conexiunea cu Supabase nu este configurată."
      );

      setAuthChecking(false);
      setLoading(false);
      setOffersLoading(false);

      return;
    }

    try {
      const restaurant =
        await loadRestaurant(
          accessToken,
          supabaseUrl,
          supabaseKey
        );

      if (!restaurant) {
        setMessage(
          "Nu am găsit restaurantul asociat acestui cont."
        );

        setLoading(false);
        setOffersLoading(false);

        return;
      }

      setRestaurantId(restaurant.id);
      setRestaurantName(restaurant.name);

      await Promise.all([
        loadReservations(
          accessToken,
          supabaseUrl,
          supabaseKey
        ),

        loadOffers(
          accessToken,
          supabaseUrl,
          supabaseKey
        ),
      ]);
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
      const response = await fetch(
        `${supabaseUrl}/rest/v1/restaurants?select=id,name&limit=1`,
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
        console.error(
          "Restaurant error:",
          data
        );

        return null;
      }

      if (!data || data.length === 0) {
        return null;
      }

      return data[0];
    } catch (error) {
      console.error(error);
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
        console.error(
          "Reservations error:",
          data
        );

        setMessage(
          "Nu am putut încărca rezervările."
        );

        return;
      }

      setReservations(data);
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
    supabaseKey
  ) {
    try {
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
        handleLogout();
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        console.error(
          "Offers error:",
          data
        );

        setOfferMessage(
          "Nu am putut încărca ofertele."
        );

        return;
      }

      setOffers(data);
    } catch (error) {
      console.error(error);

      setOfferMessage(
        "A apărut o eroare la încărcarea ofertelor."
      );
    } finally {
      setOffersLoading(false);
    }
  }

  async function createOffer(e) {
    e.preventDefault();

    setOfferMessage("");

    if (!restaurantId) {
      setOfferMessage(
        "Restaurantul nu este identificat."
      );
      return;
    }

    if (!offerDate) {
      setOfferMessage(
        "Alege data ofertei."
      );
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

    const discount =
      Number(discountPercent);

    const offerCapacity =
      Number(capacity);

    if (
      !discount ||
      discount < 1 ||
      discount > 100
    ) {
      setOfferMessage(
        "Reducerea trebuie să fie între 1% și 100%."
      );
      return;
    }

    if (
      !offerCapacity ||
      offerCapacity < 1
    ) {
      setOfferMessage(
        "Capacitatea trebuie să fie cel puțin 1."
      );
      return;
    }

    const today = getTodayISO();

    if (offerDate < today) {
      setOfferMessage(
        "Nu poți crea o ofertă pentru o dată din trecut."
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
            "Content-Type":
              "application/json",
            Prefer: "return=minimal",
          },

          body: JSON.stringify({
            restaurant_id: restaurantId,
            offer_date: offerDate,
            start_time: startTime,
            end_time: endTime,
            discount_percent:
              discount,
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
        "✅ Oferta a fost creată."
      );

      setOfferDate("");
      setStartTime("18:00");
      setEndTime("20:00");
      setDiscountPercent("20");
      setCapacity("10");

      await loadOffers(
        accessToken,
        supabaseUrl,
        supabaseKey
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

  async function toggleOffer(
    id,
    currentActive
  ) {
    setOfferUpdatingId(id);
    setOfferMessage("");

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
        `${supabaseUrl}/rest/v1/offers?id=eq.${id}`,
        {
          method: "PATCH",

          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${accessToken}`,
            "Content-Type":
              "application/json",
            Prefer: "return=minimal",
          },

          body: JSON.stringify({
            active: !currentActive,
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

        setOfferMessage(
          "Nu am putut modifica oferta."
        );

        return;
      }

      setOffers((current) =>
        current.map((offer) =>
          offer.id === id
            ? {
                ...offer,
                active:
                  !currentActive,
              }
            : offer
        )
      );
    } catch (error) {
      console.error(error);

      setOfferMessage(
        "A apărut o eroare la modificarea ofertei."
      );
    } finally {
      setOfferUpdatingId(null);
    }
  }

  async function deleteOffer(id) {
    const confirmed =
      window.confirm(
        "Sigur vrei să ștergi această ofertă?"
      );

    if (!confirmed) {
      return;
    }

    setOfferUpdatingId(id);
    setOfferMessage("");

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
        `${supabaseUrl}/rest/v1/offers?id=eq.${id}`,
        {
          method: "DELETE",

          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${accessToken}`,
            Prefer: "return=minimal",
          },
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

        setOfferMessage(
          "Nu am putut șterge oferta."
        );

        return;
      }

      setOffers((current) =>
        current.filter(
          (offer) =>
            offer.id !== id
        )
      );
    } catch (error) {
      console.error(error);

      setOfferMessage(
        "A apărut o eroare la ștergerea ofertei."
      );
    } finally {
      setOfferUpdatingId(null);
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
            "Content-Type":
              "application/json",
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

    const year =
      now.getFullYear();

    const month =
      String(
        now.getMonth() + 1
      ).padStart(2, "0");

    const day =
      String(
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
    const today =
      getTodayISO();

    return {
      today:
        reservations.filter(
          (reservation) =>
            reservation.reservation_date ===
            today
        ).length,

      pending:
        reservations.filter(
          (reservation) =>
            reservation.status ===
            "pending"
        ).length,

      accepted:
        reservations.filter(
          (reservation) =>
            reservation.status ===
            "accepted"
        ).length,

      rejected:
        reservations.filter(
          (reservation) =>
            reservation.status ===
            "rejected"
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
          fontFamily:
            "Arial, sans-serif",
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
        fontFamily:
          "Arial, sans-serif",
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
            justifyContent:
              "space-between",
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
            <span
              style={{
                color: "#FF5A3C",
              }}
            >
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
                border:
                  "1px solid #3A465D",
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
            marginBottom: "30px",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#FF5A3C",
              textTransform:
                "uppercase",
              letterSpacing: "1px",
              fontSize: "13px",
              fontWeight: "900",
            }}
          >
            Dashboard restaurant
          </p>

          <h1
            style={{
              margin:
                "8px 0 8px",
              fontSize: "42px",
              letterSpacing:
                "-1.5px",
            }}
          >
            Bun venit,{" "}
            {restaurantName}
          </h1>

          <p
            style={{
              margin: 0,
              color: "#737C8D",
              fontSize: "17px",
            }}
          >
            Gestionează rezervările
            și ofertele restaurantului.
          </p>
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
              label:
                "Rezervări azi",
              value: stats.today,
              icon: "📅",
            },
            {
              label:
                "În așteptare",
              value: stats.pending,
              icon: "⏳",
            },
            {
              label:
                "Confirmate",
              value: stats.accepted,
              icon: "✅",
            },
            {
              label:
                "Oferte active",
              value:
                offers.filter(
                  (offer) =>
                    offer.active
                ).length,
              icon: "🏷️",
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: "white",
                border:
                  "1px solid #E7E9ED",
                borderRadius: "18px",
                padding: "22px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
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

                <span>
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
            marginBottom: "50px",
          }}
        >
          <div
            style={{
              marginBottom: "20px",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#FF5A3C",
                fontSize: "13px",
                textTransform:
                  "uppercase",
                letterSpacing: "1px",
                fontWeight: "900",
              }}
            >
              Oferte Masago
            </p>

            <h2
              style={{
                fontSize: "30px",
                margin:
                  "7px 0 7px",
              }}
            >
              Creează o ofertă
            </h2>

            <p
              style={{
                color: "#737C8D",
                margin: 0,
              }}
            >
              Alege data,
              intervalul, reducerea și
              capacitatea disponibilă.
            </p>
          </div>

          <div
            style={{
              background: "white",
              border:
                "1px solid #E7E9ED",
              borderRadius: "20px",
              padding: "25px",
              marginBottom: "25px",
            }}
          >
            <form
              onSubmit={createOffer}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "15px",
                }}
              >
                <div>
                  <label
                    style={formLabel}
                  >
                    Data
                  </label>

                  <input
                    type="date"
                    min={getTodayISO()}
                    value={offerDate}
                    onChange={(e) =>
                      setOfferDate(
                        e.target.value
                      )
                    }
                    style={formField}
                  />
                </div>

                <div>
                  <label
                    style={formLabel}
                  >
                    De la
                  </label>

                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) =>
                      setStartTime(
                        e.target.value
                      )
                    }
                    style={formField}
                  />
                </div>

                <div>
                  <label
                    style={formLabel}
                  >
                    Până la
                  </label>

                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) =>
                      setEndTime(
                        e.target.value
                      )
                    }
                    style={formField}
                  />
                </div>

                <div>
                  <label
                    style={formLabel}
                  >
                    Reducere %
                  </label>

                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={
                      discountPercent
                    }
                    onChange={(e) =>
                      setDiscountPercent(
                        e.target.value
                      )
                    }
                    style={formField}
                  />
                </div>

                <div>
                  <label
                    style={formLabel}
                  >
                    Capacitate
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={capacity}
                    onChange={(e) =>
                      setCapacity(
                        e.target.value
                      )
                    }
                    style={formField}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={
                  creatingOffer
                }
                style={{
                  marginTop: "18px",
                  width: "100%",
                  border: "none",
                  borderRadius: "11px",
                  padding: "14px",
                  background:
                    creatingOffer
                      ? "#AEB4BF"
                      : "#FF5A3C",
                  color: "white",
                  fontWeight: "900",
                  fontSize: "16px",
                  cursor:
                    creatingOffer
                      ? "not-allowed"
                      : "pointer",
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
                  background:
                    offerMessage.includes(
                      "✅"
                    )
                      ? "#E9F8EF"
                      : "#FFF0EC",
                  color:
                    offerMessage.includes(
                      "✅"
                    )
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
              fontSize: "22px",
              marginBottom: "15px",
            }}
          >
            Ofertele tale
          </h3>

          {offersLoading && (
            <p>
              Se încarcă ofertele...
            </p>
          )}

          {!offersLoading &&
            offers.length === 0 && (
              <div
                style={{
                  background: "white",
                  border:
                    "1px solid #E7E9ED",
                  borderRadius: "16px",
                  padding: "25px",
                  color: "#737C8D",
                }}
              >
                Nu ai creat încă
                nicio ofertă.
              </div>
            )}

          <div
            style={{
              display: "grid",
              gap: "14px",
            }}
          >
            {offers.map((offer) => (
              <article
                key={offer.id}
                style={{
                  background: "white",
                  border:
                    "1px solid #E7E9ED",
                  borderRadius: "18px",
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(130px, 1fr))",
                    gap: "15px",
                  }}
                >
                  <div>
                    <div
                      style={
                        smallLabel
                      }
                    >
                      Data
                    </div>

                    <strong>
                      {formatDate(
                        offer.offer_date
                      )}
                    </strong>
                  </div>

                  <div>
                    <div
                      style={
                        smallLabel
                      }
                    >
                      Interval
                    </div>

                    <strong>
                      {formatTime(
                        offer.start_time
                      )}{" "}
                      –{" "}
                      {formatTime(
                        offer.end_time
                      )}
                    </strong>
                  </div>

                  <div>
                    <div
                      style={
                        smallLabel
                      }
                    >
                      Reducere
                    </div>

                    <strong
                      style={{
                        color:
                          "#FF5A3C",
                      }}
                    >
                      -
                      {
                        offer.discount_percent
                      }
                      %
                    </strong>
                  </div>

                  <div>
                    <div
                      style={
                        smallLabel
                      }
                    >
                      Capacitate
                    </div>

                    <strong>
                      {offer.capacity}
                    </strong>
                  </div>

                  <div>
                    <div
                      style={
                        smallLabel
                      }
                    >
                      Status
                    </div>

                    <strong
                      style={{
                        color:
                          offer.active
                            ? "#16865C"
                            : "#8A92A0",
                      }}
                    >
                      {offer.active
                        ? "Activă"
                        : "Inactivă"}
                    </strong>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                    marginTop: "18px",
                  }}
                >
                  <button
                    onClick={() =>
                      toggleOffer(
                        offer.id,
                        offer.active
                      )
                    }
                    disabled={
                      offerUpdatingId ===
                      offer.id
                    }
                    style={{
                      flex:
                        "1 1 180px",
                      border:
                        "1px solid #DDE1E6",
                      background:
                        "white",
                      color:
                        "#172033",
                      borderRadius:
                        "10px",
                      padding: "11px",
                      fontWeight: "800",
                      cursor: "pointer",
                    }}
                  >
                    {offer.active
                      ? "Dezactivează"
                      : "Activează"}
                  </button>

                  <button
                    onClick={() =>
                      deleteOffer(
                        offer.id
                      )
                    }
                    disabled={
                      offerUpdatingId ===
                      offer.id
                    }
                    style={{
                      flex:
                        "1 1 120px",
                      border:
                        "1px solid #F1CCCC",
                      background:
                        "#FFF7F7",
                      color:
                        "#B42318",
                      borderRadius:
                        "10px",
                      padding: "11px",
                      fontWeight: "800",
                      cursor: "pointer",
                    }}
                  >
                    Șterge
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* REZERVARI */}

        <section>
          <h2
            style={{
              fontSize: "30px",
              marginBottom: "20px",
            }}
          >
            Rezervări
          </h2>

          {message && (
            <div
              style={{
                background:
                  "#FFF0EC",
                color: "#A33A29",
                padding: "14px",
                borderRadius: "10px",
                marginBottom: "15px",
              }}
            >
              {message}
            </div>
          )}

          {loading && (
            <p>
              Se încarcă
              rezervările...
            </p>
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
                    key={
                      reservation.id
                    }
                    style={{
                      background:
                        "white",
                      border:
                        "1px solid #E7E9ED",
                      borderRadius:
                        "20px",
                      padding: "24px",
                    }}
                  >
                    <div
                      style={{
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        gap: "15px",
                        flexWrap:
                          "wrap",
                        marginBottom:
                          "20px",
                      }}
                    >
                      <div>
                        <div
                          style={
                            smallLabel
                          }
                        >
                          Cod rezervare
                        </div>

                        <div
                          style={{
                            background:
                              "#172033",
                            color:
                              "white",
                            padding:
                              "9px 12px",
                            borderRadius:
                              "9px",
                            fontWeight:
                              "900",
                            letterSpacing:
                              "1px",
                          }}
                        >
                          {reservation.reservation_code ||
                            "FĂRĂ COD"}
                        </div>
                      </div>

                      <div>
                        <div
                          style={
                            smallLabel
                          }
                        >
                          Status
                        </div>

                        <span
                          style={{
                            display:
                              "inline-block",
                            padding:
                              "9px 12px",
                            borderRadius:
                              "999px",
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

                    <div
                      style={{
                        display:
                          "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(140px, 1fr))",
                        gap: "18px",
                      }}
                    >
                      <div>
                        <div
                          style={
                            smallLabel
                          }
                        >
                          Client
                        </div>

                        <strong>
                          {
                            reservation.customer_name
                          }
                        </strong>
                      </div>

                      <div>
                        <div
                          style={
                            smallLabel
                          }
                        >
                          Telefon
                        </div>

                        <strong>
                          {
                            reservation.customer_phone
                          }
                        </strong>
                      </div>

                      <div>
                        <div
                          style={
                            smallLabel
                          }
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
                          style={
                            smallLabel
                          }
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
                          style={
                            smallLabel
                          }
                        >
                          Persoane
                        </div>

                        <strong>
                          {
                            reservation.guests
                          }
                        </strong>
                      </div>
                    </div>

                    {reservation.status ===
                      "pending" && (
                      <div
                        style={{
                          marginTop:
                            "20px",
                          paddingTop:
                            "18px",
                          borderTop:
                            "1px solid #EEF0F2",
                          display:
                            "flex",
                          gap: "10px",
                          flexWrap:
                            "wrap",
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
                              "1 1 180px",
                            border:
                              "none",
                            borderRadius:
                              "10px",
                            padding:
                              "12px",
                            background:
                              "#16865C",
                            color:
                              "white",
                            fontWeight:
                              "900",
                            cursor:
                              "pointer",
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
                          disabled={
                            updatingId ===
                            reservation.id
                          }
                          style={{
                            flex:
                              "1 1 180px",
                            border:
                              "1px solid #E1E4E8",
                            borderRadius:
                              "10px",
                            padding:
                              "12px",
                            background:
                              "white",
                            color:
                              "#B42318",
                            fontWeight:
                              "900",
                            cursor:
                              "pointer",
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

const formLabel = {
  display: "block",
  marginBottom: "7px",
  fontSize: "13px",
  fontWeight: "800",
  color: "#485267",
};

const formField = {
  width: "100%",
  boxSizing: "border-box",
  padding: "13px",
  borderRadius: "10px",
  border: "1px solid #DDE1E6",
  fontSize: "15px",
  background: "white",
  color: "#172033",
};

const smallLabel = {
  fontSize: "11px",
  color: "#8A92A0",
  marginBottom: "6px",
  fontWeight: "800",
  textTransform: "uppercase",
  letterSpacing: "0.6px",
};
