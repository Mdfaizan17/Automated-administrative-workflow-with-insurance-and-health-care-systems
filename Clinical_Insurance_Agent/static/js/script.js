function runAgents() {

    let container = document.getElementById("results");
    container.innerHTML = "";

    let data = {
        symptoms: document.getElementById("symptoms").value,
        treatment: document.getElementById("treatment").value,
        cost: document.getElementById("cost").value,
        plan: document.getElementById("plan").value
    };

    fetch('/stream', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    }).then(response => {

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        function read() {
            reader.read().then(({ done, value }) => {

                if (done) return;

                let chunk = decoder.decode(value);
                let lines = chunk.split("\n\n");

                lines.forEach(line => {
                    if (line.startsWith("data: ")) {

                        let jsonData = JSON.parse(line.replace("data: ", ""));
                        updateUI(jsonData);
                    }
                });

                read();
            });
        }

        read();
    });
}

function showStep(container, title, content) {
    let div = document.createElement("div");
    div.className = "glass p-3 mt-3 fade-in";
    div.innerHTML = `<h5>${title}</h5><pre>${content}</pre>`;
    container.appendChild(div);
}

function spinner() {
    return `
    <div class="d-flex align-items-center">
        <div class="spinner-border text-info me-2"></div>
        <span>Processing...</span>
    </div>`;
}

function updateUI(data) {

    let container = document.getElementById("results");
    let id = data.step.replace(/\s/g, '');

    let existing = document.getElementById(id);

    if (!existing) {
        let div = document.createElement("div");
        div.id = id;
        div.className = "glass p-3 mt-3 fade-in";

        div.innerHTML = `
            <h5>${data.step}</h5>
            <div class="content">${spinner()}</div>
        `;

        container.appendChild(div);
    }

    let card = document.getElementById(id).querySelector(".content");

    if (data.status === "loading") {
        card.innerHTML = spinner();
    }

    if (data.status === "done") {

    let content = data.data;
    let confidence = Math.round((content.confidence || 0.7) * 100);

    let html = formatOutput(data.step, content);

    card.innerHTML = `
        ${html}

        <div class="mt-2">
            <label>Confidence: ${confidence}%</label>
            <div class="progress">
                <div class="progress-bar ${getColor(confidence)}"
                    style="width:${confidence}%">
                </div>
            </div>
        </div>
    `;
    }
}

function getColor(conf) {
    if (conf > 75) return "bg-success";
    if (conf > 50) return "bg-warning";
    return "bg-danger";
}

function formatOutput(step, data) {

    switch(step) {

        case "Symptom Agent":

            let severityClass = "badge-low";
            if (data.severity === "Medium") severityClass = "badge-medium";
            if (data.severity === "High") severityClass = "badge-high";

            return `
                <p>
                    <i class="fa-solid fa-stethoscope"></i>
                    <strong>Condition:</strong> ${data.condition}
                </p>

                <p>
                    <strong>Severity:</strong>
                    <span class="badge ${severityClass}">
                        ${data.severity}
                    </span>
                </p>
            `;

        case "Diagnostic Agent":
            return `
                <p><i class="fa-solid fa-vials"></i>
                <strong>Recommended Tests</strong></p>

                <ul>
                    ${data.tests.map(t => `<li>${typeof t === 'object' ? t.name || JSON.stringify(t) : t}</li>`).join("")}
                </ul>
            `;

        case "Treatment Agent":
        return `
            <p>
                <i class="fa-solid fa-pills"></i>
                <strong>Evaluation:</strong>
                <span class="badge bg-warning text-dark">
                    ${data.status}
                </span>
            </p>
    
            <p>
                <strong>Reason:</strong> ${data.reason || "Not available"}
            </p>
        `;

        case "Claim Agent":

            let claimColor = "bg-success";
            if (data.status.includes("Partial")) claimColor = "bg-warning";
            if (data.status.includes("Rejected")) claimColor = "bg-danger";

            return `
                <p>
                    <i class="fa-solid fa-file-invoice-dollar"></i>
                    <strong>Claim Status:</strong>
                    <span class="badge ${claimColor}">
                        ${data.status}
                    </span>
                </p>

                <p><strong>Reason:</strong> ${data.reason || "N/A"}</p>
            `;

        case "Explanation Agent":

        let points = data.points || [data.explanation || "No explanation available"];

        return `
            <p><strong>Summary:</strong></p>
            <ul>
                ${points.map(p => `<li>${p}</li>`).join("")}
            </ul>
        `;

            default:
                return "";
        }
}

function goToResult() {

    let data = {
        symptoms: document.getElementById("symptoms").value,
        treatment: document.getElementById("treatment").value,
        cost: document.getElementById("cost").value,
        plan: document.getElementById("plan").value
    };

    // Save data temporarily
    localStorage.setItem("formData", JSON.stringify(data));

    // Redirect
    window.location.href = "/result";
}
