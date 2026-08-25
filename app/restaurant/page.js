export default function RestaurantPage() {
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

        <h1 style={{ fontSize: "36px", marginBottom: "10px" }}>
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
          <h2 style={{ color: "#ff5a3c", margin: 0 }}>
            -30% reducere
          </h2>

          <p>Reducerea se aplică la nota de plată.</p>
        </div>

        <h2 style={{ marginTop: "35px" }}>
          Rezervă o masă
        </h2>

        <div
          style={{
            display: "grid",
            gap: "15px",
            marginTop: "20px",
          }}
        >
          <input
            type="date"
            style={{
              padding: "15px",
              borderRadius: "10px",
              border: "1px solid #ddd",
              fontSize: "16px",
            }}
          />

          <select
            style={{
              padding: "15px",
              borderRadius: "10px",
              border: "1px solid #ddd",
              fontSize: "16px",
            }}
          >
            <option>Alege ora</option>
            <option>18:00</option>
            <option>18:30</option>
            <option>19:00</option>
            <option>19:30</option>
            <option>20:00</option>
            <option>20:30</option>
          </select>

          <select
            style={{
              padding: "15px",
              borderRadius: "10px",
              border: "1px solid #ddd",
              fontSize: "16px",
            }}
          >
            <option>2 persoane</option>
            <option>3 persoane</option>
            <option>4 persoane</option>
            <option>5 persoane</option>
            <option>6 persoane</option>
          </select>

          <button
            style={{
              background: "#ff5a3c",
              color: "white",
              border: "none",
              borderRadius: "10px",
              padding: "16px",
              fontSize: "17px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Rezervă masa
          </button>
        </div>
      </div>
    </main>
  );
}
