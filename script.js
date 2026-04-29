const form = document.querySelector("#rsvp-form");
const message = document.querySelector(".form-message");
const mapElement = document.querySelector("#venue-map");

if (form && message) {
  form.addEventListener("submit", async (event) => {
    if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      return;
    }

    event.preventDefault();

    const submitButton = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);
    const payload = {
      fullName: String(formData.get("fullName") || "").trim(),
      attendance: String(formData.get("attendance") || "").trim(),
      message: String(formData.get("message") || "").trim()
    };

    if (!payload.fullName) {
      message.textContent = "Please enter your full name before sending your RSVP.";
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Saving RSVP...";
    }

    message.textContent = "Saving your RSVP to the guest sheet...";

    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not save your RSVP.");
      }

      message.textContent = `${result.message} The Excel guest sheet has been updated.`;
      form.reset();
    } catch (error) {
      message.textContent = error.message || "Could not save your RSVP right now.";
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Send Blessings";
      }
    }
  });
}

if (mapElement && window.L) {
  const lat = Number(mapElement.dataset.lat);
  const lng = Number(mapElement.dataset.lng);
  const title = mapElement.dataset.title || "Venue";

  const map = L.map(mapElement, {
    scrollWheelZoom: false
  }).setView([lat, lng], 16);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  L.marker([lat, lng]).addTo(map).bindPopup(title).openPopup();
}
