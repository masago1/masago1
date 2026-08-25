export default function Home() {
  const restaurants = [
    {
      name: "Casa Bunicii",
      type: "Românesc",
      rating: "9.2",
      discount: "-30%",
      location: "Timișoara",
      emoji: "🍲",
    },
    {
      name: "Pasta Fresca",
      type: "Italian",
      rating: "9.0",
      discount: "-20%",
      location: "Timișoara",
      emoji: "🍝",
    },
    {
      name: "Urban Grill",
      type: "Grill",
      rating: "8.8",
      discount: "-25%",
      location: "Timișoara",
      emoji: "🥩",
    },
  ];

  return (
    <main
      style={{
        margin: 0,
        fontFamily: "Arial, sans-serif",
        background: "#f7f7f7",
        minHeight: "100vh",
        color: "#1f2937",
      }}
    >
      {/* NAVBAR */}
      <header
        style={{
          background: "white",
          padding: "18px 6%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #eeeeee",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontSize: "28px",
            fontWeight: "800",
          }}
        >
          Masago<span style={{ color: "#ff5a3c" }}>.</span>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            style={{
              background: "white",
              border: "1px solid #ddd",
              borderRadius: "10px",
              padding: "10px 16px",
              cursor: "pointer",
            }}
          >
            Restaurant
          </button>

          <button
            style={{
              background: "#ff5a3c",
              color: "white",
              border: "none",
              borderRadius: "10px",
              padding: "10px 18px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Intră în cont
          </button>
        </div>
      </header>

      {/* HERO */}
      <section
        style={{
          background: "linear-gradient(135deg, #ff5a3c, #ff845f)",
          color: "white",
          padding: "80px 6%",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "48px",
            margin: "0 0 16px",
          }}
        >
          Mănâncă bine. Plătește mai puțin.
        </h1>

        <p
          style={{
            fontSize: "20px",
            marginBottom: "35px",
            opacity: 0.95,
          }}
        >
          Descoperă restaurante din apropiere cu reduceri exclusive.
        </p>

        <div
          style={{
            maxWidth: "850px",
            margin: "auto",
            background: "white",
            padding: "10px",
            borderRadius: "16px",
            display: "flex",
            gap: "10px",
          }}
        >
          <input
            placeholder="Ce vrei să mănânci?"
            style={{
              flex: 1,
              border: "none",
              padding: "16px",
              fontSize: "16px",
              outline: "none",
            }}
          />

          <input
            placeholder="Timișoara"
            style={{
              width: "200px",
              border: "none",
              borderLeft: "1px solid #eee",
              padding: "16px",
              fontSize: "16px",
              outline: "none",
            }}
          />

          <button
            style={{
              background: "#222",
              color: "white",
              border: "none",
              padding: "0 28px",
              borderRadius: "12px",
              fontWeight: "bold",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            Caută
          </button>
        </div>
      </section>

      {/* RESTAURANTS */}
      <section
        style={{
          padding: "60px 6%",
          maxWidth: "1300px",
          margin: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "end",
            marginBottom: "25px",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "32px",
                marginBottom: "8px",
              }}
            >
              Oferte în Timișoara
            </h2>

            <p style={{ color: "#777", margin: 0 }}>
              Rezervă o masă și beneficiază de reducere.
            </p>
          </div>

          <button
            style={{
              background: "transparent",
              border: "none",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Vezi toate →
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "25px",
          }}
        >
          {restaurants.map((restaurant) => (
            <div
              key={restaurant.name}
              style={{
                background: "white",
                borderRadius: "18px",
                overflow: "hidden",
                boxShadow: "0 6px 25px rgba(0,0,0,0.08)",
              }}
            >
              <div
                style={{
                  height: "190px",
                  background: "#ececec",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "80px",
                  position: "relative",
                }}
              >
                {restaurant.emoji}

                <div
                  style={{
                    position: "absolute",
                    top: "15px",
                    left: "15px",
                    background: "#ff5a3c",
                    color: "white",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    fontWeight: "bold",
                  }}
                >
                  {restaurant.discount}
                </div>
              </div>

              <div style={{ padding: "20px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: "21px" }}>
                    {restaurant.name}
                  </h3>

                  <strong>⭐ {restaurant.rating}</strong>
                </div>

                <p
                  style={{
                    color: "#777",
                    margin: "10px 0",
                  }}
                >
                  {restaurant.type} • {restaurant.location}
                </p>

                <p style={{ fontWeight: "bold", color: "#ff5a3c" }}>
                  Reducere la nota de plată
                </p>

                <button
                  style={{
                    width: "100%",
                    background: "#222",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    padding: "13px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    marginTop: "5px",
                  }}
                >
                  Vezi disponibilitatea
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        style={{
          background: "white",
          padding: "60px 6%",
          textAlign: "center",
        }}
      >
        <h2 style={{ fontSize: "32px" }}>Cum funcționează?</h2>

        <div
          style={{
            maxWidth: "900px",
            margin: "40px auto 0",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "35px",
          }}
        >
          <div>
            <div style={{ fontSize: "45px" }}>🔎</div>
            <h3>1. Alege restaurantul</h3>
            <p style={{ color: "#777" }}>
              Descoperă restaurante și oferte din oraș.
            </p>
          </div>

          <div>
            <div style={{ fontSize: "45px" }}>📅</div>
            <h3>2. Rezervă</h3>
            <p style={{ color: "#777" }}>
              Alege data, ora și numărul de persoane.
            </p>
          </div>

          <div>
            <div style={{ fontSize: "45px" }}>💸</div>
            <h3>3. Primești reducerea</h3>
            <p style={{ color: "#777" }}>
              Restaurantul aplică reducerea direct pe nota de plată.
            </p>
          </div>
        </div>
      </section>

      {/* RESTAURANT CTA */}
      <section
        style={{
          margin: "60px 6%",
          padding: "50px",
          background: "#202020",
          color: "white",
          borderRadius: "22px",
          textAlign: "center",
        }}
      >
        <h2 style={{ fontSize: "32px" }}>
          Ai un restaurant?
        </h2>

        <p style={{ color: "#ccc", fontSize: "18px" }}>
          Umple mesele libere și atrage clienți noi.
        </p>

        <button
          style={{
            marginTop: "15px",
            background: "#ff5a3c",
            color: "white",
            border: "none",
            borderRadius: "10px",
            padding: "14px 25px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Înscrie restaurantul
        </button>
      </section>

      <footer
        style={{
          padding: "30px",
          textAlign: "center",
          color: "#777",
        }}
      >
        © 2026 Masago
      </footer>
    </main>
  );
}
