import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const address = body?.address?.trim();

    if (!address) {
      return NextResponse.json(
        {
          error: "Adresa este obligatorie.",
        },
        {
          status: 400,
        }
      );
    }

    const params = new URLSearchParams({
      q: address,
      format: "json",
      limit: "1",
      addressdetails: "1",
      countrycodes: "ro",
    });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      {
        headers: {
          "User-Agent": "Masago/1.0",
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      console.error(
        "Nominatim error:",
        response.status,
        response.statusText
      );

      return NextResponse.json(
        {
          error:
            "Serviciul de localizare nu este disponibil momentan.",
        },
        {
          status: 502,
        }
      );
    }

    const results = await response.json();

    if (!Array.isArray(results) || results.length === 0) {
      return NextResponse.json(
        {
          error:
            "Adresa nu a fost găsită. Încearcă o adresă mai completă.",
        },
        {
          status: 404,
        }
      );
    }

    const result = results[0];

    const latitude = Number(result.lat);
    const longitude = Number(result.lon);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return NextResponse.json(
        {
          error:
            "Coordonatele primite nu sunt valide.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      latitude,
      longitude,
      displayName: result.display_name || address,
    });
  } catch (error) {
    console.error("Geocode error:", error);

    return NextResponse.json(
      {
        error:
          "A apărut o eroare la procesarea adresei.",
      },
      {
        status: 500,
      }
    );
  }
}
