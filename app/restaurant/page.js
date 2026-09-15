"use client";
import { useEffect, useMemo, useState } from "react";

export default function RestaurantPage() {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("19:00");
  const [guests, setGuests] = useState("2");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [offers, setOffers] = useState([]);
  const [offersLoading, setOffersLoading] = useState(true);
  const [selectedOfferId, setSelectedOfferId] = useState(null);
  const [restaurantImages, setRestaurantImages] = useState([]);
  const [selectedImageUrl, setSelectedImageUrl] = useState("");
  const [imagesLoading, setImagesLoading] = useState(true);

  // Program restaurant
  const [restaurantHours, setRestaurantHours] = useState([]);
  const [hoursLoading, setHoursLoading] = useState(true);

  const dayNames = [
    "Luni",
    "Marți",
    "Miercuri",
    "Joi",
    "Vineri",
    "Sâmbătă",
    "Duminică",
  ];

  useEffect(() => {
    loadOffers();
    loadClientProfile();
    loadRestaurantImages();
    loadRestaurantHours();
  }, []);

  async function loadRestaurantImages() {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      setImagesLoading(false);
      return;
    }

    try {
      const restaurantResponse = await fetch(
        `${supabaseUrl}/rest/v1/restaurants?name=eq.${encodeURIComponent(
          "Casa Bunicii"
        )}&select=id&limit=1`,
        {
          headers: {
            apikey: supabaseKey,
          },
        }
      );

      const restaurantData =
        await restaurantResponse.json();

      if (
        !restaurantResponse.ok ||
        !restaurantData?.[0]?.id
      ) {
        console.error(
          "Restaurant image lookup error:",
          restaurantData
        );

        setRestaurantImages([]);
        return;
      }

      const currentRestaurantId =
        restaurantData[0].id;

      const imagesResponse = await fetch(
        `${supabaseUrl}/rest/v1/restaurant_images?restaurant_id=eq.${currentRestaurantId}&select=id,image_url,position,is_cover,created_at&order=position.asc`,
        {
          headers: {
            apikey: supabaseKey,
          },
        }
      );

      const imagesData =
        await imagesResponse.json();

      if (!imagesResponse.ok) {
        console.error(
          "Restaurant images error:",
          imagesData
        );

        setRestaurantImages([]);
        return;
      }

      const sortedImages = [
        ...(imagesData || []),
      ].sort((a, b) => {
        if (a.is_cover && !b.is_cover) {
          return -1;
        }

        if (!a.is_cover && b.is_cover) {
          return 1;
        }

        return (
          Number(a.position || 0) -
          Number(b.position || 0)
        );
      });

      setRestaurantImages(
        sortedImages
      );

      const coverImage =
        sortedImages.find(
          (image) =>
            image.is_cover
        ) ||
        sortedImages[0] ||
        null;

      setSelectedImageUrl(
        coverImage?.image_url ||
          ""
      );
    } catch (error) {
      console.error(
        "Eroare încărcare fotografii restaurant:",
        error
      );

      setRestaurantImages([]);
    } finally {
      setImagesLoading(false);
    }
  }

  async function loadRestaurantHours() {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      setHoursLoading(false);
      return;
    }

    try {
      const restaurantResponse = await fetch(
        `${supabaseUrl}/rest/v1/restaurants?name=eq.${encodeURIComponent(
          "Casa Bunicii"
        )}&select=id&limit=1`,
        {
          headers: {
            apikey: supabaseKey,
          },
        }
      );

      const restaurantData =
        await restaurantResponse.json();

      if (
        !restaurantResponse.ok ||
        !restaurantData?.[0]?.id
      ) {
        console.error(
          "Restaurant hours lookup error:",
          restaurantData
        );

        setRestaurantHours([]);
        return;
      }

      const currentRestaurantId =
        restaurantData[0].id;

      const hoursResponse = await fetch(
        `${supabaseUrl}/rest/v1/restaurant_hours?restaurant_id=eq.${currentRestaurantId}&select=day_of_week,opening_time,closing_time,is_closed&order=day_of_week.asc`,
        {
          headers: {
            apikey: supabaseKey,
          },
        }
      );

      const hoursData =
        await hoursResponse.json();

      if (!hoursResponse.ok) {
        console.error(
          "Restaurant hours error:",
          hoursData
        );

        setRestaurantHours([]);
        return;
      }

      setRestaurantHours(
        (hoursData || []).map((row) => ({
          ...row,

          day_of_week:
            Number(row.day_of_week),

          opening_time:
            row.opening_time
              ? String(
                  row.opening_time
                ).slice(0, 5)
              : null,

          closing_time:
            row.closing_time
              ? String(
                  row.closing_time
                ).slice(0, 5)
              : null,

          is_closed:
            Boolean(row.is_closed),
        }))
      );
    } catch (error) {
      console.error(
        "Eroare încărcare program restaurant:",
        error
      );

      setRestaurantHours([]);
    } finally {
      setHoursLoading(false);
    }
  }

  async function loadClientProfile() {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    const clientAccessToken =
      localStorage.getItem(
        "masago_client_access_token"
      );

    if (
      !supabaseUrl ||
      !supabaseKey ||
      !clientAccessToken
    ) {
      return;
    }

    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/client_profiles?select=full_name,phone&limit=1`,
        {
          headers: {
            apikey: supabaseKey,

            Authorization:
              `Bearer ${clientAccessToken}`,
          },
        }
      );

      if (!response.ok) {
        console.error(
          "Profile load error:",
          await response.text()
        );

        return;
      }

      const data =
        await response.json();

      const profile =
        data?.[0];

      if (!profile) {
        return;
      }

      if (profile.full_name) {
        setName(
          profile.full_name
        );
      }

      if (profile.phone) {
        setPhone(
          profile.phone
        );
      }
    } catch (error) {
      console.error(
        "Eroare încărcare profil client:",
        error
      );
    }
  }

  function getLocalDate(offset = 0) {
    const currentDate =
      new Date();

    currentDate.setDate(
      currentDate.getDate() +
        offset
    );

    const year =
      currentDate.getFullYear();

    const month =
      String(
        currentDate.getMonth() +
          1
      ).padStart(2, "0");

    const day =
      String(
        currentDate.getDate()
      ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  const today =
    getLocalDate(0);

  const maxReservationDate =
    getLocalDate(3);

  async function loadOffers(
    preferredOfferId = null
  ) {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error(
        "Conexiunea cu Supabase nu este configurată."
      );

      setOffersLoading(false);
      return;
    }

    try {
      const offersResponse =
        await fetch(
          `${supabaseUrl}/rest/v1/rpc/get_offer_availability`,
          {
            method: "POST",

            headers: {
              apikey:
                supabaseKey,

              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                p_restaurant_name:
                  "Casa Bunicii",

                p_from_date:
                  today,

                p_to_date:
                  maxReservationDate,
              }),
          }
        );

      const offersData =
        await offersResponse.json();

      if (!offersResponse.ok) {
        console.error(
          "Offers availability error:",
          offersData
        );

        setOffers([]);
        return;
      }

      const normalizedOffers =
        (offersData || []).map(
          (offer) => ({
            ...offer,

            capacity:
              Number(
                offer.capacity
              ) || 0,

            reserved_places:
              Number(
                offer.reserved_places
              ) || 0,

            remaining_places:
              Number(
                offer.remaining_places
              ) || 0,
          })
        );

      setOffers(
        normalizedOffers
      );

      const currentDate =
        date || today;

      if (!date) {
        setDate(today);
      }

      const offersForDay =
        normalizedOffers
          .filter(
            (offer) =>
              offer.offer_date ===
              currentDate
          )
          .sort((a, b) =>
            String(
              a.start_time
            ).localeCompare(
              String(
                b.start_time
              )
            )
          );

      let offerToSelect =
        null;

      if (preferredOfferId) {
        offerToSelect =
          offersForDay.find(
            (offer) =>
              String(
                offer.id
              ) ===
                String(
                  preferredOfferId
                ) &&
              offer.remaining_places >
                0
          );
      }

      if (!offerToSelect) {
        offerToSelect =
          offersForDay.find(
            (offer) =>
              offer.remaining_places >
              0
          );
      }

      if (offerToSelect) {
        setSelectedOfferId(
          offerToSelect.id
        );

        setTime(
          String(
            offerToSelect.start_time
          ).slice(0, 5)
        );
      } else {
        setSelectedOfferId(
          null
        );

        setTime("19:00");
      }
    } catch (error) {
      console.error(
        "Eroare la încărcarea ofertelor:",
        error
      );

      setOffers([]);
    } finally {
      setOffersLoading(false);
    }
  }

  const selectedDayOffers =
    useMemo(() => {
      if (!date) {
        return [];
      }

      return offers
        .filter(
          (offer) =>
            offer.offer_date ===
            date
        )
        .sort((a, b) =>
          String(
            a.start_time
          ).localeCompare(
            String(
              b.start_time
            )
          )
        );
    }, [
      offers,
      date,
    ]);

  const selectedOffer =
    useMemo(() => {
      if (!selectedOfferId) {
        return null;
      }

      return (
        offers.find(
          (offer) =>
            String(
              offer.id
            ) ===
            String(
              selectedOfferId
            )
        ) || null
      );
    }, [
      offers,
      selectedOfferId,
    ]);

  const upcomingDays =
    useMemo(() => {
      return [
        0,
        1,
        2,
        3,
      ].map(
        (offset) => {
          const currentDate =
            getLocalDate(
              offset
            );

          const dayOffers =
            offers.filter(
              (offer) =>
                offer.offer_date ===
                currentDate
            );

          const availableOffers =
            dayOffers.filter(
              (offer) =>
                offer.remaining_places >
                0
            );

          return {
            date:
              currentDate,

            offers:
              dayOffers,

            availableOffers,
          };
        }
      );
    }, [offers]);

  function handleDateChange(
    newDate
  ) {
    setDate(newDate);
    setMessage("");

    const offersForDay =
      offers
        .filter(
          (offer) =>
            offer.offer_date ===
            newDate
        )
        .sort((a, b) =>
          String(
            a.start_time
          ).localeCompare(
            String(
              b.start_time
            )
          )
        );

    const firstAvailable =
      offersForDay.find(
        (offer) =>
          offer.remaining_places >
          0
      );

    if (firstAvailable) {
      setSelectedOfferId(
        firstAvailable.id
      );

      setTime(
        String(
          firstAvailable.start_time
        ).slice(0, 5)
      );
    } else {
      setSelectedOfferId(
        null
      );

      setTime("19:00");
    }
  }

  function selectOffer(
    offer
  ) {
    if (
      offer.remaining_places <=
      0
    ) {
      setMessage(
        "Această ofertă este SOLD OUT."
      );

      return;
    }

    setSelectedOfferId(
      offer.id
    );

    setTime(
      String(
        offer.start_time
      ).slice(0, 5)
    );

    setMessage("");
  }

  function generateReservationCode() {
    const randomPart =
      crypto
        .randomUUID()
        .replaceAll("-", "")
        .slice(0, 8)
        .toUpperCase();

    return `MASAGO-${randomPart}`;
  }

  function formatDateRomanian(
    value
  ) {
    if (!value) {
      return "";
    }

    const [
      year,
      month,
      day,
    ] =
      value.split("-");

    return `${day}/${month}/${year}`;
  }

  function formatShortDate(
    value
  ) {
    if (!value) {
      return "";
    }

    const [
      ,
      month,
      day,
    ] =
      value.split("-");

    return `${day}/${month}`;
  }

  function formatTime(
    value
  ) {
    if (!value) {
      return "";
    }

    return String(
      value
    ).slice(0, 5);
  }

  function getDayLabel(
    value,
    index
  ) {
    if (index === 0) {
      return "Azi";
    }

    if (index === 1) {
      return "Mâine";
    }

    return formatShortDate(
      value
    );
  }

  function getRestaurantDayIndexFromDate(
    value
  ) {
    if (!value) {
      return null;
    }

    const selectedDate =
      new Date(
        `${value}T12:00:00`
      );

    if (
      Number.isNaN(
        selectedDate.getTime()
      )
    ) {
      return null;
    }

    // JavaScript: 0 = Duminică
    // Supabase Masago: 0 = Luni
    return (
      selectedDate.getDay() +
      6
    ) % 7;
  }

  function getHoursForDate(
    value
  ) {
    const dayIndex =
      getRestaurantDayIndexFromDate(
        value
      );

    if (dayIndex === null) {
      return null;
    }

    return (
      restaurantHours.find(
        (row) =>
          Number(
            row.day_of_week
          ) === dayIndex
      ) || null
    );
  }

  function reservationTimeIsInsideHours() {
    const selectedHours =
      getHoursForDate(
        date
      );

    // Dacă programul nu a fost setat,
    // păstrăm funcționarea existentă.
    if (!selectedHours) {
      return true;
    }

    if (
      selectedHours.is_closed
    ) {
      return false;
    }

    const selectedTime =
      String(
        time || ""
      ).slice(0, 5);

    const openingTime =
      formatTime(
        selectedHours.opening_time
      );

    const closingTime =
      formatTime(
        selectedHours.closing_time
      );

    if (
      !selectedTime ||
      !openingTime ||
      !closingTime
    ) {
      return true;
    }

    return (
      selectedTime >=
        openingTime &&
      selectedTime <=
        closingTime
    );
  }

  function getOpenStatus() {
    if (hoursLoading) {
      return {
        isOpen:
          false,

        label:
          "Se verifică programul...",

        detail:
          "",

        neutral:
          true,
      };
    }

    if (
      !restaurantHours.length
    ) {
      return {
        isOpen:
          false,

        label:
          "Program indisponibil",

        detail:
          "",

        neutral:
          true,
      };
    }

    const parts =
      new Intl.DateTimeFormat(
        "ro-RO",
        {
          timeZone:
            "Europe/Bucharest",

          weekday:
            "short",

          hour:
            "2-digit",

          minute:
            "2-digit",

          hour12:
            false,
        }
      ).formatToParts(
        new Date()
      );

    const weekday =
      parts.find(
        (part) =>
          part.type ===
          "weekday"
      )?.value || "";

    const hour =
      parts.find(
        (part) =>
          part.type ===
          "hour"
      )?.value || "00";

    const minute =
      parts.find(
        (part) =>
          part.type ===
          "minute"
      )?.value || "00";

    const weekdayMap = {
      lun: 0,
      mar: 1,
      mie: 2,
      joi: 3,
      vin: 4,
      sâm: 5,
      sam: 5,
      dum: 6,
    };

    const normalizedWeekday =
      weekday
        .toLowerCase()
        .replace(".", "");

    const dayIndex =
      weekdayMap[
        normalizedWeekday
      ];

    const nowTime =
      `${hour}:${minute}`;

    const todayHours =
      restaurantHours.find(
        (row) =>
          Number(
            row.day_of_week
          ) === dayIndex
      );

    if (
      todayHours &&
      !todayHours.is_closed &&
      todayHours.opening_time &&
      todayHours.closing_time
    ) {
      const opening =
        formatTime(
          todayHours.opening_time
        );

      const closing =
        formatTime(
          todayHours.closing_time
        );

      if (
        nowTime >= opening &&
        nowTime <= closing
      ) {
        return {
          isOpen:
            true,

          label:
            "Deschis acum",

          detail:
            `până la ${closing}`,

          neutral:
            false,
        };
      }

      if (
        nowTime <
        opening
      ) {
        return {
          isOpen:
            false,

          label:
            "Închis acum",

          detail:
            `deschide azi la ${opening}`,

          neutral:
            false,
        };
      }
    }

    for (
      let offset = 1;
      offset <= 7;
      offset += 1
    ) {
      const nextIndex =
        (
          Number(
            dayIndex
          ) +
          offset
        ) %
        7;

      const nextHours =
        restaurantHours.find(
          (row) =>
            Number(
              row.day_of_week
            ) ===
            nextIndex
        );

      if (
        nextHours &&
        !nextHours.is_closed &&
        nextHours.opening_time
      ) {
        const opening =
          formatTime(
            nextHours.opening_time
          );

        return {
          isOpen:
            false,

          label:
            "Închis acum",

          detail:
            offset === 1
              ? `deschide mâine la ${opening}`
              : `deschide ${dayNames[
                  nextIndex
                ].toLowerCase()} la ${opening}`,

          neutral:
            false,
        };
      }
    }

    return {
      isOpen:
        false,

      label:
        "Închis",

      detail:
        "",

      neutral:
        false,
    };
  }

  function timeIsInsideOffer() {
    if (!selectedOffer) {
      return true;
    }

    const selectedTime =
      String(
        time
      ).slice(0, 5);

    const start =
      formatTime(
        selectedOffer.start_time
      );

    const end =
      formatTime(
        selectedOffer.end_time
      );

    return (
      selectedTime >= start &&
      selectedTime <= end
    );
  }

  async function handleReservation() {
    setMessage("");

    if (!date) {
      setMessage(
        "Alege data rezervării."
      );

      return;
    }

    if (!time) {
      setMessage(
        "Alege ora rezervării."
      );

      return;
    }

    const selectedDayHours =
      getHoursForDate(
        date
      );

    if (
      selectedDayHours &&
      selectedDayHours.is_closed
    ) {
      setMessage(
        `Restaurantul este închis ${
          dayNames[
            selectedDayHours.day_of_week
          ]
        }. Alege altă zi.`
      );

      return;
    }

    if (
      selectedDayHours &&
      !selectedDayHours.is_closed &&
      selectedDayHours.opening_time &&
      selectedDayHours.closing_time &&
      !reservationTimeIsInsideHours()
    ) {
      setMessage(
        `În această zi, restaurantul este deschis între ${formatTime(
          selectedDayHours.opening_time
        )} și ${formatTime(
          selectedDayHours.closing_time
        )}.`
      );

      return;
    }

    const guestNumber =
      Number(guests);

    if (
      selectedOffer &&
      selectedOffer.remaining_places <=
        0
    ) {
      setMessage(
        "Oferta este SOLD OUT."
      );

      return;
    }

    if (
      selectedOffer &&
      guestNumber >
        selectedOffer.remaining_places
    ) {
      setMessage(
        `Oferta mai are doar ${selectedOffer.remaining_places} locuri disponibile.`
      );

      return;
    }

    if (
      selectedOffer &&
      !timeIsInsideOffer()
    ) {
      setMessage(
        `Pentru oferta de -${selectedOffer.discount_percent}%, ora trebuie să fie între ${formatTime(
          selectedOffer.start_time
        )} și ${formatTime(
          selectedOffer.end_time
        )}.`
      );

      return;
    }

    if (!name.trim()) {
      setMessage(
        "Introdu numele."
      );

      return;
    }

    if (!phone.trim()) {
      setMessage(
        "Introdu numărul de telefon."
      );

      return;
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (
      !supabaseUrl ||
      !supabaseKey
    ) {
      setMessage(
        "Conexiunea cu Supabase nu este configurată."
      );

      return;
    }

    const reservationCode =
      generateReservationCode();

    const clientAccessToken =
      localStorage.getItem(
        "masago_client_access_token"
      );

    const authHeaders =
      clientAccessToken
        ? {
            Authorization:
              `Bearer ${clientAccessToken}`,
          }
        : {};

    setLoading(true);

    try {
      if (selectedOffer) {
        const response =
          await fetch(
            `${supabaseUrl}/rest/v1/rpc/create_offer_reservation`,
            {
              method:
                "POST",

              headers: {
                apikey:
                  supabaseKey,

                "Content-Type":
                  "application/json",

                ...authHeaders,
              },

              body:
                JSON.stringify({
                  p_offer_id:
                    selectedOffer.id,

                  p_restaurant_name:
                    "Casa Bunicii",

                  p_reservation_date:
                    date,

                  p_reservation_time:
                    time,

                  p_guests:
                    guestNumber,

                  p_customer_name:
                    name.trim(),

                  p_customer_phone:
                    phone.trim(),

                  p_reservation_code:
                    reservationCode,
                }),
            }
          );

        const result =
          await response.json();

        if (!response.ok) {
          console.error(
            "Reservation error:",
            result
          );

          setMessage(
            result?.message ||
              result?.error ||
              "Rezervarea nu a putut fi creată."
          );

          await loadOffers(
            selectedOffer.id
          );

          return;
        }
      } else {
        const response =
          await fetch(
            `${supabaseUrl}/rest/v1/reservations`,
            {
              method:
                "POST",

              headers: {
                apikey:
                  supabaseKey,

                "Content-Type":
                  "application/json",

                Prefer:
                  "return=minimal",

                ...authHeaders,
              },

              body:
                JSON.stringify({
                  restaurant_name:
                    "Casa Bunicii",

                  reservation_date:
                    date,

                  reservation_time:
                    time,

                  guests:
                    guestNumber,

                  customer_name:
                    name.trim(),

                  customer_phone:
                    phone.trim(),

                  status:
                    "pending",

                  reservation_code:
                    reservationCode,

                  offer_id:
                    null,

                  discount_percent:
                    null,
                }),
            }
          );

        if (!response.ok) {
          const errorText =
            await response.text();

          setMessage(
            `Eroare Supabase: ${errorText}`
          );

          return;
        }
      }

      const reservationSummary =
        {
          code:
            reservationCode,

          date:
            formatDateRomanian(
              date
            ),

          time,

          guests,

          name:
            name.trim(),

          discount:
            selectedOffer
              ?.discount_percent ||
            null,

          offerId:
            selectedOffer?.id ||
            null,
        };

      localStorage.setItem(
        "masago_last_reservation_code",
        reservationCode
      );

      const savedReservations =
        JSON.parse(
          localStorage.getItem(
            "masago_reservation_codes"
          ) || "[]"
        );

      const updatedReservations = [
        reservationCode,

        ...savedReservations.filter(
          (savedCode) =>
            savedCode !==
            reservationCode
        ),
      ];

      localStorage.setItem(
        "masago_reservation_codes",
        JSON.stringify(
          updatedReservations
        )
      );

      setConfirmation(
        reservationSummary
      );

      await loadOffers(
        selectedOffer?.id ||
          null
      );

      setGuests("2");
    } catch (error) {
      console.error(error);

      setMessage(
        `Eroare: ${error.message}`
      );
    } finally {
      setLoading(false);
    }
  }

  function makeAnotherReservation() {
    setConfirmation(null);
    setMessage("");
  }

  const openStatus =
    getOpenStatus();

  const selectedDateHours =
    getHoursForDate(
      date
    );

  const fieldStyle = {
    marginBottom:
      "18px",
  };

  const labelStyle = {
    display:
      "block",

    fontWeight:
      "800",

    marginBottom:
      "8px",

    color:
      "#172033",
  };

  const inputStyle = {
    width:
      "100%",

    boxSizing:
      "border-box",

    padding:
      "15px 16px",

    border:
      "1px solid #dfe3e8",

    borderRadius:
      "12px",

    fontSize:
      "16px",

    background:
      "white",

    color:
      "#172033",

    outline:
      "none",
  };

  return (
    <main
      style={{
        minHeight:
          "100vh",

        background:
          "#FAFAF8",

        fontFamily:
          "Arial, sans-serif",

        color:
          "#172033",
      }}
    >
      <header
        style={{
          background:
            "white",

          borderBottom:
            "1px solid #ececec",

          padding:
            "18px 6%",

          display:
            "flex",

          justifyContent:
            "space-between",

          alignItems:
            "center",

          position:
            "sticky",

          top:
            0,

          zIndex:
            20,
        }}
      >
        <a
          href="/"
          style={{
            textDecoration:
              "none",

            color:
              "#172033",

            fontSize:
              "29px",

            fontWeight:
              "900",

            letterSpacing:
              "-1px",
          }}
        >
          Masago

          <span
            style={{
              color:
                "#FF5A3C",
            }}
          >
            .
          </span>
        </a>

        <a
          href="/"
          style={{
            textDecoration:
              "none",

            color:
              "#485267",

            fontWeight:
              "700",
          }}
        >
          ← Înapoi la restaurante
        </a>
      </header>

      <section
        style={{
          background:
            "linear-gradient(135deg, #172033 0%, #202C43 100%)",

          color:
            "white",

          padding:
            "55px 6%",
        }}
      >
        <div
          style={{
            maxWidth:
              "1180px",

            margin:
              "0 auto",

            display:
              "grid",

            gridTemplateColumns:
              "repeat(auto-fit, minmax(300px, 1fr))",

            gap:
              "35px",

            alignItems:
              "center",
          }}
        >
          <div>
            <div
              style={{
                display:
                  "inline-block",

                background:
                  "rgba(255,90,60,0.16)",

                color:
                  "#FF8A73",

                border:
                  "1px solid rgba(255,90,60,0.35)",

                borderRadius:
                  "999px",

                padding:
                  "8px 12px",

                fontSize:
                  "14px",

                fontWeight:
                  "800",

                marginBottom:
                  "18px",
              }}
            >
              Românesc • Timișoara
            </div>

            <h1
              style={{
                fontSize:
                  "clamp(44px, 6vw, 66px)",

                margin:
                  0,

                letterSpacing:
                  "-2px",
              }}
            >
              Casa Bunicii
            </h1>

            <p
              style={{
                fontSize:
                  "18px",

                color:
                  "#cbd2dd",

                lineHeight:
                  1.6,

                maxWidth:
                  "600px",
              }}
            >
              Bucătărie românească și
              preparate tradiționale,
              cu oferte disponibile în
              mai multe intervale orare.
            </p>

            <div
              style={{
                display:
                  "flex",

                gap:
                  "12px",

                flexWrap:
                  "wrap",

                marginTop:
                  "22px",
              }}
            >
              <span
                style={{
                  background:
                    "white",

                  color:
                    "#172033",

                  padding:
                    "10px 13px",

                  borderRadius:
                    "10px",

                  fontWeight:
                    "800",
                }}
              >
                ⭐ 9.2
              </span>

              <span
                style={{
                  background:
                    openStatus.neutral
                      ? "rgba(255,255,255,0.12)"
                      : openStatus.isOpen
                      ? "#E9F8EF"
                      : "#FFF0EC",

                  color:
                    openStatus.neutral
                      ? "#D5DAE3"
                      : openStatus.isOpen
                      ? "#16865C"
                      : "#B42318",

                  padding:
                    "10px 13px",

                  borderRadius:
                    "10px",

                  fontWeight:
                    "900",
                }}
              >
                {!openStatus.neutral &&
                  (openStatus.isOpen
                    ? "🟢 "
                    : "🔴 ")}

                {openStatus.label}

                {openStatus.detail
                  ? ` • ${openStatus.detail}`
                  : ""}
              </span>

              {selectedOffer &&
                selectedOffer.remaining_places >
                  0 && (
                  <span
                    style={{
                      background:
                        "#FF5A3C",

                      color:
                        "white",

                      padding:
                        "10px 13px",

                      borderRadius:
                        "10px",

                      fontWeight:
                        "900",
                    }}
                  >
                    -
                    {
                      selectedOffer.discount_percent
                    }
                    % reducere
                  </span>
                )}
            </div>
          </div>

          <div>
            <div
              style={{
                height:
                  "320px",

                borderRadius:
                  "22px",

                background:
                  "linear-gradient(135deg, #2b3448, #151c2b)",

                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                fontSize:
                  "110px",

                border:
                  "1px solid #334057",

                boxShadow:
                  "0 20px 60px rgba(0,0,0,0.25)",

                overflow:
                  "hidden",

                position:
                  "relative",
              }}
            >
              {imagesLoading ? (
                <div
                  style={{
                    fontSize:
                      "15px",

                    fontWeight:
                      "800",

                    color:
                      "#cbd2dd",
                  }}
                >
                  Se încarcă fotografiile...
                </div>
              ) : selectedImageUrl ? (
                <img
                  src={
                    selectedImageUrl
                  }
                  alt="Casa Bunicii"
                  style={{
                    width:
                      "100%",

                    height:
                      "100%",

                    objectFit:
                      "cover",

                    display:
                      "block",
                  }}
                />
              ) : (
                <>
                  <img
                    src="/image.png"
                    alt="Casa Bunicii"
                    onError={(event) => {
                      event.currentTarget.style.display =
                        "none";

                      const fallback =
                        event
                          .currentTarget
                          .nextElementSibling;

                      if (fallback) {
                        fallback.style.display =
                          "flex";
                      }
                    }}
                    style={{
                      width:
                        "100%",

                      height:
                        "100%",

                      objectFit:
                        "cover",

                      display:
                        "block",
                    }}
                  />

                  <div
                    style={{
                      display:
                        "none",

                      width:
                        "100%",

                      height:
                        "100%",

                      alignItems:
                        "center",

                      justifyContent:
                        "center",

                      fontSize:
                        "110px",
                    }}
                  >
                    🍲
                  </div>
                </>
              )}
            </div>

            {restaurantImages.length >
              1 && (
              <div
                style={{
                  display:
                    "grid",

                  gridTemplateColumns:
                    "repeat(6, minmax(0, 1fr))",

                  gap:
                    "8px",

                  marginTop:
                    "10px",
                }}
              >
                {restaurantImages.map(
                  (image) => {
                    const active =
                      selectedImageUrl ===
                      image.image_url;

                    return (
                      <button
                        key={
                          image.id
                        }
                        type="button"
                        onClick={() =>
                          setSelectedImageUrl(
                            image.image_url
                          )
                        }
                        aria-label={`Vezi fotografia ${image.position}`}
                        style={{
                          height:
                            "64px",

                          padding:
                            0,

                          border:
                            active
                              ? "3px solid #FF5A3C"
                              : "2px solid rgba(255,255,255,0.25)",

                          borderRadius:
                            "10px",

                          overflow:
                            "hidden",

                          background:
                            "#202C43",

                          cursor:
                            "pointer",

                          position:
                            "relative",
                        }}
                      >
                        <img
                          src={
                            image.image_url
                          }
                          alt={`Casa Bunicii fotografia ${image.position}`}
                          style={{
                            width:
                              "100%",

                            height:
                              "100%",

                            objectFit:
                              "cover",

                            display:
                              "block",
                          }}
                        />

                        {image.is_cover && (
                          <span
                            style={{
                              position:
                                "absolute",

                              top:
                                "4px",

                              left:
                                "4px",

                              background:
                                "rgba(23,32,51,0.85)",

                              color:
                                "white",

                              borderRadius:
                                "999px",

                              padding:
                                "3px 6px",

                              fontSize:
                                "9px",

                              fontWeight:
                                "900",
                            }}
                          >
                            ★
                          </span>
                        )}
                      </button>
                    );
                  }
                )}
              </div>
            )}

            {restaurantImages.length >
              0 && (
              <div
                style={{
                  marginTop:
                    "9px",

                  color:
                    "#AEB7C6",

                  fontSize:
                    "12px",

                  fontWeight:
                    "700",

                  textAlign:
                    "right",
                }}
              >
                {restaurantImages.length}{" "}

                {restaurantImages.length ===
                1
                  ? "fotografie"
                  : "fotografii"}
              </div>
            )}
          </div>
        </div>
      </section>

      <section
        style={{
          maxWidth:
            "1180px",

          margin:
            "0 auto",

          padding:
            "28px 6% 0",
        }}
      >
        <div
          style={{
            background:
              "white",

            border:
              "1px solid #E7E9ED",

            borderRadius:
              "20px",

            padding:
              "24px",

            boxShadow:
              "0 10px 30px rgba(23,32,51,0.05)",
          }}
        >
          <div
            style={{
              display:
                "flex",

              justifyContent:
                "space-between",

              alignItems:
                "center",

              gap:
                "15px",

              flexWrap:
                "wrap",

              marginBottom:
                "18px",
            }}
          >
            <div>
              <div
                style={{
                  color:
                    "#FF5A3C",

                  fontSize:
                    "12px",

                  fontWeight:
                    "900",

                  letterSpacing:
                    "1px",

                  marginBottom:
                    "5px",
                }}
              >
                PROGRAM
              </div>

              <h2
                style={{
                  margin: 0,
                  fontSize: "25px",
                }}
              >
                🕐 Program restaurant
              </h2>
            </div>

            <span
              style={{
                background:
                  openStatus.neutral
                    ? "#F2F4F7"
                    : openStatus.isOpen
                    ? "#E9F8EF"
                    : "#FFF0EC",

                color:
                  openStatus.neutral
                    ? "#667085"
                    : openStatus.isOpen
                    ? "#16865C"
                    : "#B42318",

                padding: "9px 12px",
                borderRadius: "999px",
                fontWeight: "900",
                fontSize: "13px",
              }}
            >
              {!openStatus.neutral &&
                (openStatus.isOpen
                  ? "🟢 "
                  : "🔴 ")}

              {openStatus.label}
            </span>
          </div>

          {hoursLoading ? (
            <div
              style={{
                color: "#667085",
                fontWeight: "700",
                padding: "12px 0",
              }}
            >
              Se încarcă programul...
            </div>
          ) : restaurantHours.length === 0 ? (
            <div
              style={{
                background: "#F8F9FB",
                borderRadius: "12px",
                padding: "15px",
                color: "#667085",
              }}
            >
              Programul restaurantului nu este disponibil momentan.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: "8px",
              }}
            >
              {dayNames.map(
                (dayName, index) => {
                  const hours =
                    restaurantHours.find(
                      (row) =>
                        Number(
                          row.day_of_week
                        ) === index
                    );

                  const isSelectedDay =
                    date &&
                    getRestaurantDayIndexFromDate(
                      date
                    ) === index;

                  return (
                    <div
                      key={dayName}
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "center",
                        gap: "15px",
                        padding: "11px 13px",
                        borderRadius: "11px",

                        background:
                          isSelectedDay
                            ? "#FFF5F2"
                            : "#FAFAFB",

                        border:
                          isSelectedDay
                            ? "1px solid #FFD8CF"
                            : "1px solid #F0F1F3",
                      }}
                    >
                      <strong
                        style={{
                          color:
                            isSelectedDay
                              ? "#FF5A3C"
                              : "#172033",
                        }}
                      >
                        {dayName}
                      </strong>

                      <span
                        style={{
                          color:
                            !hours ||
                            hours.is_closed
                              ? "#B42318"
                              : "#485267",

                          fontWeight: "800",
                          fontSize: "14px",
                        }}
                      >
                        {!hours
                          ? "Program nesetat"
                          : hours.is_closed
                          ? "Închis"
                          : `${formatTime(
                              hours.opening_time
                            )} – ${formatTime(
                              hours.closing_time
                            )}`}
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          )}

          {!hoursLoading &&
            openStatus.detail && (
              <div
                style={{
                  marginTop: "15px",
                  padding: "12px 14px",
                  borderRadius: "11px",
                  background:
                    openStatus.isOpen
                      ? "#E9F8EF"
                      : "#F8F9FB",
                  color:
                    openStatus.isOpen
                      ? "#16865C"
                      : "#667085",
                  fontSize: "13px",
                  fontWeight: "800",
                }}
              >
                {openStatus.isOpen
                  ? `🟢 Restaurantul este deschis ${openStatus.detail}.`
                  : `🔴 Restaurantul este închis • ${openStatus.detail}.`}
              </div>
            )}
        </div>
      </section>

      <section
        style={{
          maxWidth: "1180px",
          margin: "0 auto",
          padding: "55px 6% 80px",
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "30px",
          alignItems: "start",
        }}
      >
        <div>
          <div
            style={{
              background: "white",
              border: "1px solid #ebedf0",
              borderRadius: "20px",
              padding: "28px",
              boxShadow:
                "0 10px 30px rgba(23,32,51,0.05)",
              marginBottom: "22px",
            }}
          >
            <h2
              style={{
                marginTop: 0,
                fontSize: "26px",
              }}
            >
              Alege ziua
            </h2>

            <p
              style={{
                color: "#667085",
                lineHeight: 1.6,
              }}
            >
              Vezi ofertele Casei Bunicii pentru următoarele zile.
            </p>

            {offersLoading ? (
              <div
                style={{
                  color: "#667085",
                  fontWeight: "800",
                }}
              >
                Se încarcă ofertele...
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(2, minmax(0, 1fr))",
                  gap: "10px",
                  marginTop: "20px",
                }}
              >
                {upcomingDays.map(
                  (day, index) => {
                    const active =
                      date === day.date;

                    const dayHours =
                      getHoursForDate(
                        day.date
                      );

                    const dayClosed =
                      dayHours?.is_closed ===
                      true;

                    return (
                      <button
                        key={day.date}
                        type="button"
                        onClick={() =>
                          handleDateChange(
                            day.date
                          )
                        }
                        style={{
                          border: active
                            ? "2px solid #FF5A3C"
                            : "1px solid #E2E5E9",

                          background: active
                            ? "#FFF5F2"
                            : "white",

                          borderRadius: "14px",
                          padding: "15px",
                          textAlign: "left",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{
                            color: "#667085",
                            fontSize: "12px",
                            fontWeight: "800",
                            marginBottom: "6px",
                          }}
                        >
                          {getDayLabel(
                            day.date,
                            index
                          )}
                        </div>

                        <div
                          style={{
                            fontWeight: "900",
                            fontSize: "16px",
                          }}
                        >
                          {formatDateRomanian(
                            day.date
                          )}
                        </div>

                        {dayHours && (
                          <div
                            style={{
                              marginTop: "7px",
                              color: dayClosed
                                ? "#B42318"
                                : "#16865C",
                              fontSize: "12px",
                              fontWeight: "800",
                            }}
                          >
                            {dayClosed
                              ? "🔴 Închis"
                              : `🕐 ${formatTime(
                                  dayHours.opening_time
                                )} – ${formatTime(
                                  dayHours.closing_time
                                )}`}
                          </div>
                        )}

                        <div
                          style={{
                            marginTop: "8px",

                            color:
                              dayClosed
                                ? "#98A2B3"
                                : day
                                    .availableOffers
                                    .length > 0
                                ? "#FF5A3C"
                                : "#98A2B3",

                            fontWeight: "900",
                            fontSize: "13px",
                          }}
                        >
                          {dayClosed
                            ? "Rezervări indisponibile"
                            : day.offers.length ===
                              0
                            ? "Fără ofertă"
                            : day
                                .availableOffers
                                .length === 0
                            ? "SOLD OUT"
                            : `${day.availableOffers.length} ${
                                day
                                  .availableOffers
                                  .length === 1
                                  ? "ofertă disponibilă"
                                  : "oferte disponibile"
                              }`}
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            )}
          </div>

          <div
            style={{
              background: "white",
              border: "1px solid #E7E9ED",
              borderRadius: "20px",
              padding: "25px",
            }}
          >
            <h2
              style={{
                margin: "0 0 5px",
                fontSize: "24px",
              }}
            >
              Oferte pentru{" "}
              {formatDateRomanian(
                date
              )}
            </h2>

            {selectedDateHours && (
              <div
                style={{
                  display: "inline-block",
                  margin: "7px 0 15px",
                  padding: "7px 10px",
                  borderRadius: "999px",

                  background:
                    selectedDateHours.is_closed
                      ? "#FFF0EC"
                      : "#E9F8EF",

                  color:
                    selectedDateHours.is_closed
                      ? "#B42318"
                      : "#16865C",

                  fontSize: "12px",
                  fontWeight: "900",
                }}
              >
                {selectedDateHours.is_closed
                  ? "🔴 Restaurant închis în această zi"
                  : `🕐 Deschis ${formatTime(
                      selectedDateHours.opening_time
                    )} – ${formatTime(
                      selectedDateHours.closing_time
                    )}`}
              </div>
            )}

            <p
              style={{
                margin: "0 0 20px",
                color: "#667085",
                lineHeight: 1.5,
              }}
            >
              Alege intervalul care ți se potrivește.
            </p>

            {selectedDateHours?.is_closed ? (
              <div
                style={{
                  background: "#FFF0EC",
                  border:
                    "1px solid #FFD8CF",
                  borderRadius: "14px",
                  padding: "20px",
                }}
              >
                <strong
                  style={{
                    display: "block",
                    marginBottom: "7px",
                    color: "#B42318",
                  }}
                >
                  🔴 Restaurant închis
                </strong>

                <div
                  style={{
                    color: "#667085",
                    lineHeight: 1.6,
                  }}
                >
                  Casa Bunicii este închisă în această zi. Alege altă zi pentru rezervare.
                </div>
              </div>
            ) : selectedDayOffers.length >
              0 ? (
              <div
                style={{
                  display: "grid",
                  gap: "12px",
                }}
              >
                {selectedDayOffers.map(
                  (offer) => {
                    const active =
                      String(
                        selectedOfferId
                      ) ===
                      String(
                        offer.id
                      );

                    const soldOut =
                      offer.remaining_places <=
                      0;

                    return (
                      <div
                        key={offer.id}
                        style={{
                          border: active
                            ? "2px solid #FF5A3C"
                            : "1px solid #E4E7EC",

                          background: soldOut
                            ? "#F4F4F5"
                            : active
                            ? "#FFF5F2"
                            : "white",

                          borderRadius: "16px",
                          padding: "18px",

                          opacity: soldOut
                            ? 0.75
                            : 1,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent:
                              "space-between",
                            alignItems:
                              "center",
                            gap: "12px",
                            flexWrap: "wrap",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                color: soldOut
                                  ? "#667085"
                                  : "#FF5A3C",
                                fontSize: "28px",
                                fontWeight: "900",
                              }}
                            >
                              -
                              {
                                offer.discount_percent
                              }
                              %
                            </div>

                            <div
                              style={{
                                marginTop: "5px",
                                fontWeight: "900",
                              }}
                            >
                              {formatTime(
                                offer.start_time
                              )}{" "}
                              -{" "}
                              {formatTime(
                                offer.end_time
                              )}
                            </div>

                            <div
                              style={{
                                marginTop: "8px",
                                fontSize: "14px",
                                fontWeight: "900",

                                color: soldOut
                                  ? "#B42318"
                                  : "#16865C",
                              }}
                            >
                              {soldOut
                                ? "🔴 SOLD OUT"
                                : `🪑 ${offer.remaining_places} ${
                                    offer.remaining_places ===
                                    1
                                      ? "loc disponibil"
                                      : "locuri disponibile"
                                  }`}
                            </div>

                            <div
                              style={{
                                color: "#98A2B3",
                                marginTop: "4px",
                                fontSize: "12px",
                              }}
                            >
                              Capacitate ofertă:{" "}
                              {offer.capacity}{" "}
                              locuri
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={soldOut}
                            onClick={() =>
                              selectOffer(
                                offer
                              )
                            }
                            style={{
                              border: "none",

                              background: soldOut
                                ? "#AEB4BF"
                                : active
                                ? "#16865C"
                                : "#172033",

                              color: "white",
                              borderRadius: "10px",
                              padding: "11px 14px",
                              fontWeight: "900",

                              cursor: soldOut
                                ? "not-allowed"
                                : "pointer",
                            }}
                          >
                            {soldOut
                              ? "SOLD OUT"
                              : active
                              ? "✓ Selectată"
                              : "Alege oferta"}
                          </button>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            ) : (
              <div
                style={{
                  background: "#F2F4F7",
                  border:
                    "1px solid #E4E7EC",
                  borderRadius: "14px",
                  padding: "20px",
                }}
              >
                <strong
                  style={{
                    display: "block",
                    marginBottom: "7px",
                  }}
                >
                  Nicio ofertă setată
                </strong>

                <div
                  style={{
                    color: "#667085",
                    lineHeight: 1.6,
                  }}
                >
                  Casa Bunicii nu a setat încă o ofertă pentru această zi.
                </div>

                <div
                  style={{
                    color: "#667085",
                    lineHeight: 1.6,
                    marginTop: "6px",
                  }}
                >
                  Poți face în continuare o rezervare normală, fără reducere.
                </div>
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            background: "white",
            border: "1px solid #ebedf0",
            borderRadius: "22px",
            padding: "30px",
            boxShadow:
              "0 18px 45px rgba(23,32,51,0.08)",
          }}
        >
          {confirmation ? (
            <>
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  margin: "0 auto 20px",
                  borderRadius: "50%",
                  background: "#E9F8EF",
                  color: "#16865C",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "30px",
                }}
              >
                ✓
              </div>

              <div
                style={{
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    color: "#16865C",
                    fontWeight: "900",
                    textTransform:
                      "uppercase",
                    letterSpacing: "1px",
                    fontSize: "13px",
                  }}
                >
                  Rezervare trimisă
                </p>

                <h2>
                  Mulțumim,{" "}
                  {confirmation.name}!
                </h2>

                <p
                  style={{
                    color: "#737C8D",
                    lineHeight: 1.6,
                  }}
                >
                  Solicitarea a fost trimisă către Casa Bunicii și așteaptă confirmarea restaurantului.
                </p>

                {confirmation.discount ? (
                  <div
                    style={{
                      marginTop: "15px",
                      background: "#FFF0EC",
                      padding: "14px",
                      borderRadius: "12px",
                      color: "#FF5A3C",
                      fontWeight: "900",
                    }}
                  >
                    Oferta rezervată: -
                    {confirmation.discount}%
                  </div>
                ) : (
                  <div
                    style={{
                      marginTop: "15px",
                      background: "#F2F4F7",
                      padding: "14px",
                      borderRadius: "12px",
                      color: "#667085",
                      fontWeight: "800",
                    }}
                  >
                    Rezervare fără ofertă Masago.
                  </div>
                )}
              </div>

              <div
                style={{
                  margin: "25px 0",
                  padding: "22px",
                  background: "#172033",
                  color: "white",
                  borderRadius: "16px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    color: "#AEB7C6",
                    fontSize: "12px",
                    textTransform:
                      "uppercase",
                    letterSpacing: "1px",
                    fontWeight: "800",
                  }}
                >
                  Cod rezervare
                </div>

                <div
                  style={{
                    fontSize: "27px",
                    fontWeight: "900",
                    letterSpacing: "2px",
                    marginTop: "8px",
                  }}
                >
                  {confirmation.code}
                </div>
              </div>

              <a
                href="/verifica-rezervare"
                style={{
                  display: "block",
                  width: "100%",
                  boxSizing:
                    "border-box",
                  textDecoration: "none",
                  textAlign: "center",
                  background: "#FF5A3C",
                  color: "white",
                  borderRadius: "12px",
                  padding: "15px",
                  fontWeight: "900",
                  marginBottom: "12px",
                }}
              >
                Vezi statusul rezervării
              </a>

              <button
                type="button"
                onClick={
                  makeAnotherReservation
                }
                style={{
                  width: "100%",
                  border:
                    "1px solid #DDE1E6",
                  borderRadius: "12px",
                  padding: "14px",
                  background: "white",
                  color: "#172033",
                  fontWeight: "900",
                  cursor: "pointer",
                }}
              >
                Fă altă rezervare
              </button>
            </>
          ) : (
            <>
              <p
                style={{
                  margin: 0,
                  color: "#FF5A3C",
                  fontWeight: "900",
                  fontSize: "13px",
                  textTransform:
                    "uppercase",
                  letterSpacing: "1px",
                }}
              >
                Rezervare
              </p>

              <h2
                style={{
                  fontSize: "30px",
                  margin: "7px 0 8px",
                }}
              >
                Rezervă o masă
              </h2>

              <p
                style={{
                  color: "#737C8D",
                  marginTop: 0,
                  marginBottom: "25px",
                  lineHeight: 1.5,
                }}
              >
                Selectează ziua, oferta și ora rezervării.
              </p>

              {selectedDateHours && (
                <div
                  style={{
                    background:
                      selectedDateHours.is_closed
                        ? "#FFF0EC"
                        : "#E9F8EF",

                    border:
                      selectedDateHours.is_closed
                        ? "1px solid #FFD8CF"
                        : "1px solid #CBEBD8",

                    borderRadius: "12px",
                    padding: "13px 15px",
                    marginBottom: "15px",

                    color:
                      selectedDateHours.is_closed
                        ? "#B42318"
                        : "#16865C",

                    fontWeight: "900",
                    fontSize: "13px",
                  }}
                >
                  {selectedDateHours.is_closed
                    ? "🔴 Restaurantul este închis în ziua selectată."
                    : `🕐 Program în ziua selectată: ${formatTime(
                        selectedDateHours.opening_time
                      )} – ${formatTime(
                        selectedDateHours.closing_time
                      )}`}
                </div>
              )}

              {selectedOffer ? (
                <div
                  style={{
                    background: "#FFF0EC",
                    border:
                      "1px solid #FFD8CF",
                    borderRadius: "12px",
                    padding: "15px",
                    marginBottom: "22px",
                    color: "#A33A29",
                    fontWeight: "800",
                  }}
                >
                  <div
                    style={{
                      color: "#FF5A3C",
                      fontSize: "21px",
                      fontWeight: "900",
                      marginBottom: "5px",
                    }}
                  >
                    -
                    {
                      selectedOffer.discount_percent
                    }
                    %
                  </div>

                  📅{" "}
                  {formatDateRomanian(
                    selectedOffer.offer_date
                  )}
                  <br />

                  🕐{" "}
                  {formatTime(
                    selectedOffer.start_time
                  )}{" "}
                  -{" "}
                  {formatTime(
                    selectedOffer.end_time
                  )}
                  <br />

                  <span
                    style={{
                      color: "#16865C",
                      fontWeight: "900",
                    }}
                  >
                    🪑{" "}
                    {
                      selectedOffer.remaining_places
                    }{" "}
                    {selectedOffer.remaining_places ===
                    1
                      ? "loc disponibil"
                      : "locuri disponibile"}
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    background: "#F2F4F7",
                    border:
                      "1px solid #E4E7EC",
                    borderRadius: "12px",
                    padding: "15px",
                    marginBottom: "22px",
                    color: "#667085",
                    fontWeight: "800",
                  }}
                >
                  ℹ️ Restaurantul nu a setat încă o ofertă disponibilă pentru ziua selectată.
                </div>
              )}

              <div
                style={fieldStyle}
              >
                <label
                  style={labelStyle}
                >
                  Data rezervării
                </label>

                <input
                  type="date"
                  value={date}
                  min={today}
                  max={
                    maxReservationDate
                  }
                  onChange={(e) =>
                    handleDateChange(
                      e.target.value
                    )
                  }
                  style={inputStyle}
                />
              </div>

              <div
                style={fieldStyle}
              >
                <label
                  style={labelStyle}
                >
                  Ora rezervării
                </label>

                <input
                  type="time"
                  value={time}
                  min={
                    selectedOffer
                      ? formatTime(
                          selectedOffer.start_time
                        )
                      : selectedDateHours &&
                        !selectedDateHours.is_closed
                      ? formatTime(
                          selectedDateHours.opening_time
                        )
                      : undefined
                  }
                  max={
                    selectedOffer
                      ? formatTime(
                          selectedOffer.end_time
                        )
                      : selectedDateHours &&
                        !selectedDateHours.is_closed
                      ? formatTime(
                          selectedDateHours.closing_time
                        )
                      : undefined
                  }
                  disabled={
                    selectedDateHours?.is_closed ===
                    true
                  }
                  onChange={(e) =>
                    setTime(
                      e.target.value
                    )
                  }
                  style={{
                    ...inputStyle,

                    background:
                      selectedDateHours?.is_closed
                        ? "#F2F4F7"
                        : "white",

                    cursor:
                      selectedDateHours?.is_closed
                        ? "not-allowed"
                        : "text",
                  }}
                />

                {selectedOffer && (
                  <div
                    style={{
                      marginTop: "8px",
                      color: "#667085",
                      fontSize: "13px",
                    }}
                  >
                    Pentru reducerea de{" "}
                    <strong>
                      -
                      {
                        selectedOffer.discount_percent
                      }
                      %
                    </strong>
                    , rezervarea trebuie făcută între{" "}
                    <strong>
                      {formatTime(
                        selectedOffer.start_time
                      )}{" "}
                      și{" "}
                      {formatTime(
                        selectedOffer.end_time
                      )}
                    </strong>
                    .
                  </div>
                )}

                {!selectedOffer &&
                  selectedDateHours &&
                  !selectedDateHours.is_closed && (
                    <div
                      style={{
                        marginTop: "8px",
                        color: "#667085",
                        fontSize: "13px",
                      }}
                    >
                      Restaurantul primește rezervări între{" "}
                      <strong>
                        {formatTime(
                          selectedDateHours.opening_time
                        )}{" "}
                        și{" "}
                        {formatTime(
                          selectedDateHours.closing_time
                        )}
                      </strong>
                      .
                    </div>
                  )}
              </div>

              <div
                style={fieldStyle}
              >
                <label
                  style={labelStyle}
                >
                  Număr de persoane
                </label>

                <select
                  value={guests}
                  onChange={(e) =>
                    setGuests(
                      e.target.value
                    )
                  }
                  style={inputStyle}
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

                {selectedOffer &&
                  Number(guests) >
                    selectedOffer.remaining_places && (
                    <div
                      style={{
                        marginTop: "8px",
                        color: "#B42318",
                        fontWeight: "800",
                        fontSize: "13px",
                      }}
                    >
                      Nu mai sunt suficiente locuri pentru acest număr de persoane.
                    </div>
                  )}
              </div>

              <div
                style={fieldStyle}
              >
                <label
                  style={labelStyle}
                >
                  Nume
                </label>

                <input
                  type="text"
                  placeholder="Numele tău"
                  value={name}
                  onChange={(e) =>
                    setName(
                      e.target.value
                    )
                  }
                  style={inputStyle}
                />
              </div>

              <div
                style={fieldStyle}
              >
                <label
                  style={labelStyle}
                >
                  Număr de telefon
                </label>

                <input
                  type="tel"
                  placeholder="07xxxxxxxx"
                  value={phone}
                  onChange={(e) =>
                    setPhone(
                      e.target.value
                    )
                  }
                  style={inputStyle}
                />
              </div>

              <button
                type="button"
                onClick={
                  handleReservation
                }
                disabled={
                  loading ||
                  selectedDateHours?.is_closed ===
                    true ||
                  (selectedOffer &&
                    (selectedOffer.remaining_places <=
                      0 ||
                      Number(guests) >
                        selectedOffer.remaining_places))
                }
                style={{
                  width: "100%",
                  marginTop: "5px",
                  border: "none",
                  borderRadius: "12px",
                  padding: "16px",

                  background:
                    loading ||
                    selectedDateHours?.is_closed ===
                      true ||
                    (selectedOffer &&
                      (selectedOffer.remaining_places <=
                        0 ||
                        Number(guests) >
                          selectedOffer.remaining_places))
                      ? "#aeb4bf"
                      : "#FF5A3C",

                  color: "white",
                  fontSize: "17px",
                  fontWeight: "900",

                  cursor:
                    loading ||
                    selectedDateHours?.is_closed ===
                      true ||
                    (selectedOffer &&
                      (selectedOffer.remaining_places <=
                        0 ||
                        Number(guests) >
                          selectedOffer.remaining_places))
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {loading
                  ? "Se trimite..."
                  : selectedDateHours?.is_closed
                  ? "Restaurant închis"
                  : selectedOffer
                  ? `Rezervă cu -${selectedOffer.discount_percent}%`
                  : "Rezervă fără reducere"}
              </button>

              {message && (
                <div
                  style={{
                    marginTop: "20px",
                    padding: "14px",
                    borderRadius: "11px",
                    background: "#FFF0EC",
                    color: "#A33A29",
                    fontWeight: "800",
                    textAlign: "center",
                  }}
                >
                  {message}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
