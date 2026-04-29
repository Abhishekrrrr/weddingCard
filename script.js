const form = document.querySelector("#rsvp-form");
const message = document.querySelector(".form-message");
const mapElement = document.querySelector("#venue-map");
const pagePetals = document.querySelector("#page-petals");
let petalIntervalId = null;

if (form && message) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);
    const isLocalhost =
      window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
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

    message.textContent = isLocalhost
      ? "Saving your RSVP to the guest sheet..."
      : "Sending your RSVP with love...";

    try {
      if (isLocalhost) {
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
      } else {
        const response = await fetch("/", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: new URLSearchParams(formData).toString()
        });

        if (!response.ok) {
          throw new Error("Could not submit your RSVP right now.");
        }

        window.location.href = "/success.html";
        return;
      }

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

function spawnPagePetals(count = 16) {
  if (!pagePetals) {
    return;
  }

  const scrollableHeight = Math.max(
    document.documentElement.scrollHeight - window.innerHeight,
    1
  );
  const scrollProgress = Math.min(window.scrollY / scrollableHeight, 1);
  const densityFactor = 1 - scrollProgress * 0.75;
  const mobileFactor = window.innerWidth <= 820 ? 0.58 : 1;
  const adjustedCount = Math.max(2, Math.round(count * densityFactor * mobileFactor));

  for (let index = 0; index < adjustedCount; index += 1) {
    const petal = document.createElement("span");
    const size = 10 + Math.random() * 10;
    const duration = (window.innerWidth <= 820 ? 5.5 : 4.6) + Math.random() * 2.8;

    petal.className = "page-petal";
    petal.style.left = `${Math.random() * 100}%`;
    petal.style.width = `${size}px`;
    petal.style.height = `${size * 1.25}px`;
    petal.style.animationDuration = `${duration}s`;
    petal.style.animationDelay = `${index * 0.12}s`;
    petal.style.setProperty("--petal-drift", `${(Math.random() - 0.5) * 180}px`);
    pagePetals.appendChild(petal);

    window.setTimeout(() => {
      petal.remove();
    }, (duration + 1) * 1000);
  }
}

if (pagePetals) {
  window.addEventListener("load", () => {
    spawnPagePetals(24);
    petalIntervalId = window.setInterval(() => {
      spawnPagePetals(window.innerWidth <= 820 ? 7 : 10);
    }, window.innerWidth <= 820 ? 4000 : 3200);
  });

  window.addEventListener("beforeunload", () => {
    if (petalIntervalId) {
      window.clearInterval(petalIntervalId);
    }
  });
}
