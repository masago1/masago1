export default function Home() {
  const restaurants = [
    {
      name: "Casa Bunicii",
      type: "Românesc",
      rating: "9.2",
      discount: "-30%",
      location: "Timișoara",
      emoji: "🍲",
      href: "/restaurant",
    },
    {
      name: "Pasta Fresca",
      type: "Italian",
      rating: "9.0",
      discount: "-20%",
      location: "Timișoara",
      emoji: "🍝",
      href: "/restaurant",
    },
    {
      name: "Urban Grill",
      type: "Grill",
      rating: "8.8",
      discount: "-25%",
      location: "Timișoara",
      emoji: "🍔",
      href: "/restaurant",
    },
    {
      name: "Boom Pub",
      type: "Pub",
      rating: "9.1",
      discount: "-20%",
      location: "Timișoara",
      emoji: "🍻",
      href: "/restaurant/boom-pub",
    },
  ];

  return (
    <main
      style={{
        fontFamily: "Arial, sans-serif",
        margin: 0,
        background: "#f7f7f7",
        minHeight: "100vh",
        color: "#172033",
      }}
    >
      {/* HEADER */}
      <header
        style={{
          background: "white",
          padding: "20px 6%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #eee",
        }}
      >
        <div
          style={{
            fontSize: "28px",
            fontWeight: "bold",
          }}
        >
          Masago
          <span style={{ color: "#ff5a43" }}>.</span>
        </div>

        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "center",
          }}
        >
          <a
            href="/login"
            style={{
              textDecoration: "none",
              color: "#222",
              border: "1px solid #ddd",
              padding: "11px 18px",
              borderRadius: "10px",
              fontWeight: "bold",
            }}
          >
            Restaurant
          </a>

          <a
            href="/login"
            style={{
              textDecoration: "none",
              background: "#ff5a43",
              color: "white",
              padding: "12px 20px",
              borderRadius: "10px",
              fontWeight: "bold",
            }}
          >
            Intră în cont
          </a>
        </div>
      </header>

      {/* HERO */}
      <section
        style={{
          background: "#ff684f",
          padding: "70px 6%",
          color: "white",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "46px",
            margin: "0 0 15px 0",
          }}
        >
          Mănâncă bine. Plătește mai puțin.
        </h1>

        <p
          style={{
            fontSize: "18px",
            marginBottom: "35px",
          }}
        >
          Descoperă restaurante din apropiere cu reduceri exclusive.
        </p>

        <div
          style={{
            maxWidth: "800px",
            margin: "auto",
            background: "white",
            display: "flex",
            borderRadius: "14px",
            overflow: "hidden",
            padding: "8px",
          }}
        >
          <input
            placeholder="Ce vrei să mănânci?"
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              padding: "15px",
              fontSize: "16px",
            }}
          />

          <div
            style={{
              width: "1px",
              background: "#eee",
            }}
          />

          <input
            value="Timișoara"
            readOnly
            style={{
              width: "180px",
              border: "none",
              outline: "none",
              padding: "15px",
              fontSize: "16px",
              color: "#777",
            }}
          />

          <button
            style={{
              background: "#222",
              color: "white",
              border: "none",
              padding: "0 28px",
              borderRadius: "10px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Caută
          </button>
        </div>
      </section>

      {/* RESTAURANTE */}
      <section
        style={{
          padding: "55px 6%",
          maxWidth: "1300px",
          margin: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: "25px",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "30px",
                marginBottom: "5px",
              }}
            >
              Oferte în Timișoara
            </h2>

            <p
              style={{
                color: "#777",
                margin: 0,
              }}
            >
              Rezervă o masă și beneficiază de reducere.
            </p>
          </div>

          <span
            style={{
              fontWeight: "bold",
              fontSize: "14px",
            }}
          >
            Vezi toate →
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "22px",
          }}
        >
          {restaurants.map((restaurant) => (
            <div
              key={restaurant.name}
              style={{
                background: "white",
                borderRadius: "18px",
                overflow: "hidden",
                boxShadow:
                  "0 5px 20px rgba(0,0,0,0.07)",
              }}
            >
              {/* POZA / EMOJI */}
              <div
                style={{
                  height: "180px",
                  background: "#eeeeee",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    fontSize: "75px",
                  }}
                >
                  {restaurant.emoji}
                </div>

                <div
                  style={{
                    position: "absolute",
                    top: "14px",
                    left: "14px",
                    background: "#ff5a43",
                    color: "white",
                    fontSize: "32px",
                    fontWeight: "bold",
                    padding: "8px 13px",
                    borderRadius: "8px",
                  }}
                >
                  {restaurant.discount}
                </div>
              </div>

              {/* DETALII */}
              <div
                style={{
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "21px",
                    }}
                  >
                    {restaurant.name}
                  </h3>

                  <strong>
                    ⭐ {restaurant.rating}
                  </strong>
                </div>

                <p
                  style={{
                    color: "#777",
                    marginTop: "8px",
                  }}
                >
                  {restaurant.type} • {restaurant.location}
                </p>

                <p
                  style={{
                    fontWeight: "bold",
                    color: "#ff5a43",
                  }}
                >
                  Reducere la nota de plată
                </p>

                <a
                  href={restaurant.href}
                  style={{
                    display: "block",
                    width: "100%",
                    boxSizing: "border-box",
                    background: "#222",
                    color: "white",
                    borderRadius: "10px",
                    padding: "13px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    marginTop: "12px",
                    textAlign: "center",
                    textDecoration: "none",
                  }}
                >
                  Vezi disponibilitatea
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CUM FUNCTIONEAZA */}
      <section
        style={{
          background: "white",
          padding: "60px 6%",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: "30px",
            marginBottom: "45px",
          }}
        >
          Cum funcționează?
        </h2>

        <div
          style={{
            maxWidth: "1000px",
            margin: "auto",
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "40px",
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
    </main>
  );
}
