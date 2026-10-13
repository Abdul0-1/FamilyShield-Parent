import { useEffect, useState } from "react";
import api from "../api";

export default function Dashboard() {
  const [children, setChildren] = useState([]);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [pairCodes, setPairCodes] = useState({});
  const [devices, setDevices] = useState({});
  const [error, setError] = useState("");

  async function loadChildren() {
    const res = await api.get("/children");
    setChildren(res.data);

    const nextDevices = {};
    for (const child of res.data) {
      try {
        const d = await api.get(`/children/${child.id}/devices`);
        nextDevices[child.id] = d.data;
      } catch {
        nextDevices[child.id] = [];
      }
    }
    setDevices(nextDevices);
  }

  useEffect(() => {
    loadChildren().catch(() => setError("Could not load dashboard"));
  }, []);

  async function addChild(e) {
    e.preventDefault();
    setError("");

    try {
      await api.post("/children", { name, age: Number(age) });
      setName("");
      setAge("");
      await loadChildren();
    } catch (err) {
      setError(err.response?.data || "Could not add child");
    }
  }

  async function generateCode(childId) {
    try {
      const res = await api.post(`/children/${childId}/pairing-code`);
      setPairCodes(prev => ({ ...prev, [childId]: res.data }));
    } catch (err) {
      setError(err.response?.data || "Could not generate pairing code");
    }
  }

  async function unpair(deviceId) {
    if (!confirm("Unpair this device?")) return;

    try {
      await api.delete(`/devices/${deviceId}`);
      await loadChildren();
    } catch {
      setError("Could not unpair device");
    }
  }

  function logout() {
    localStorage.removeItem("parentToken");
    window.location.href = "/login";
  }

  return (
    <div className="dashboard">
      <header className="topbar">
        <div>
          <h1>FamilyShield</h1>
          <span>Parent Control Center</span>
        </div>
        <button className="secondary" onClick={logout}>Logout</button>
      </header>

      <main className="content">
        <section className="hero">
          <div>
            <h2>Device-aware parental control</h2>
            <p>
              A child profile is only a profile. A real device appears here
              only after it is explicitly paired.
            </p>
          </div>
          <div className="stat">
            <strong>{children.length}</strong>
            <span>Children</span>
          </div>
        </section>

        <section className="panel">
          <h2>Add Child Profile</h2>
          <form className="inline-form" onSubmit={addChild}>
            <input
              placeholder="Child name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
            <input
              type="number"
              min="1"
              max="25"
              placeholder="Age"
              value={age}
              onChange={e => setAge(e.target.value)}
              required
            />
            <button>Add Child</button>
          </form>
        </section>

        {error && <div className="error global">{error}</div>}

        <div className="child-grid">
          {children.map(child => (
            <section className="child-card" key={child.id}>
              <div className="child-head">
                <div>
                  <h2>{child.name}</h2>
                  <p>Age {child.age}</p>
                </div>
                <span className={child.pairingActive ? "badge active" : "badge"}>
                  {child.pairingActive ? "Pairing open" : "Ready"}
                </span>
              </div>

              <button onClick={() => generateCode(child.id)}>
                Generate Pairing Code
              </button>

              {pairCodes[child.id] && (
                <div className="pair-box">
                  <span>Give this code to the child/device:</span>
                  <strong>{pairCodes[child.id].code}</strong>
                  <small>Expires: {pairCodes[child.id].expiresAt}</small>
                </div>
              )}

              <h3>Paired Devices</h3>

              {(devices[child.id] || []).length === 0 ? (
                <p className="muted">
                  No device paired yet. Generate a code and open the Child
                  Device Agent on the child's device.
                </p>
              ) : (
                <div className="device-list">
                  {devices[child.id].map(device => (
                    <div className="device" key={device.id}>
                      <div>
                        <strong>{device.deviceName}</strong>
                        <span>{device.platform}</span>
                        <span>{device.status}</span>
                      </div>

                      <div className="device-data">
                        <span>Battery: {device.batteryLevel < 0 ? "N/A" : `${device.batteryLevel}%`}</span>
                        <span>
                          Location:
                          {device.latitude === 0 && device.longitude === 0
                            ? " Not received"
                            : ` ${device.latitude.toFixed(5)}, ${device.longitude.toFixed(5)}`}
                        </span>
                        <span>Last seen: {device.lastSeen || "N/A"}</span>
                      </div>

                      {device.latitude !== 0 && device.longitude !== 0 && (
                        <a
                          href={`https://www.google.com/maps?q=${device.latitude},${device.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open location
                        </a>
                      )}

                      <button className="danger" onClick={() => unpair(device.id)}>
                        Unpair
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
