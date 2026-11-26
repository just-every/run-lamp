(() => {
  let turnstileScript;
  function loadTurnstile() {
    if (window.turnstile) return Promise.resolve(window.turnstile);
    turnstileScript ??= new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.onload = () => resolve(window.turnstile);
      script.onerror = () => {
        script.remove();
        turnstileScript = undefined;
        reject(new Error("Could not load Turnstile"));
      };
      document.head.append(script);
    });
    return turnstileScript;
  }

  async function solveTurnstile(form, sitekey) {
    const turnstile = await loadTurnstile();
    const container = document.createElement("div");
    container.dataset.subscribeWidget = "";
    form.append(container);
    let widget;
    try {
      return await new Promise((resolve, reject) => {
        widget = turnstile.render(container, {
          sitekey,
          action: "lamp_subscribe",
          appearance: "interaction-only",
          size: "compact",
          "response-field": false,
          callback: resolve,
          "error-callback": reject,
          "expired-callback": reject,
          "timeout-callback": reject,
        });
      });
    } finally {
      if (widget !== undefined) turnstile.remove(widget);
      container.remove();
    }
  }

  function field(form, name, value) {
    const input = form.elements.namedItem(name) || document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    if (!input.isConnected) form.append(input);
  }

  for (const form of document.querySelectorAll("form[data-subscribe-check]")) {
    let pendingChallenge, submitting = false;
    async function challenge() {
      pendingChallenge ??= (async () => {
        const started = performance.now();
        const response = await fetch("/subscribe/challenge", { cache: "no-store" });
        if (!response.ok) throw new Error("Could not get subscription challenge");
        const data = await response.json();
        return { ...data, ready: performance.now() + data.waitMs, expires: started + data.expiresInMs - 10_000 };
      })().catch(error => {
        pendingChallenge = undefined;
        throw error;
      });
      const data = await pendingChallenge;
      if (performance.now() >= data.expires) {
        pendingChallenge = undefined;
        return challenge();
      }
      return data;
    }
    form.addEventListener("focusin", () => { void challenge().catch(() => {}); });
    window.addEventListener("pageshow", event => {
      if (event.persisted) {
        pendingChallenge = undefined;
        submitting = false;
      }
    });
    form.addEventListener("submit", async event => {
      event.preventDefault();
      if (submitting) return;
      submitting = true;
      let status = form.querySelector("[data-subscribe-status]");
      if (!status) {
        status = document.createElement("p");
        status.dataset.subscribeStatus = "";
        status.setAttribute("role", "status");
        form.append(status);
      }
      status.textContent = "Checking your subscription…";
      try {
        let data = await challenge();
        if (data.siteKey) {
          field(form, "cf-turnstile-response", await solveTurnstile(form, data.siteKey));
          data = await challenge();
        }
        const remaining = data.ready - performance.now();
        if (remaining > 0) await new Promise(resolve => setTimeout(resolve, Math.ceil(remaining)));
        field(form, "subscribeToken", data.token);
        if (form.reportValidity()) {
          status.textContent = "";
          HTMLFormElement.prototype.submit.call(form);
          return;
        }
        status.textContent = "";
      } catch {
        status.textContent = "The subscription check could not finish. Try again.";
      }
      submitting = false;
    });
  }
})();
