export default function calculateRisk(previousState, health) {

    let risk = previousState?.riskScore || 0;

    let focusPenalty = 0;
    let idlePenalty = 0;
    let monitorPenalty = 0;
    let securityPenalty = 0;

    if (health.foreground.process !== "exam_browser.exe") {
        if (health.foreground.durationMs > 4000) {
            focusPenalty = 0.4;
        }
    }

    if (health.activity.idleTimeMs > 15000) {
        idlePenalty = 0.1;
    }

    if (health.display.monitorCount > 1) {
        monitorPenalty = 0.5;
    }

    if (health.security.suspiciousProcess) {
        securityPenalty = 0.3;
    }

    const violationScore =
        focusPenalty +
        idlePenalty +
        monitorPenalty +
        securityPenalty;

    risk = Math.max(
        0,
        Math.min(1, risk + violationScore ** 2 - 0.02)
    );

    return {
        riskScore: risk,
        lastSeen: health.timestamp,
        monitorCount: health.display.monitorCount
    };
}