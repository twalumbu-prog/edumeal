
import { storage } from "./server/storage";
async function check() {
    try {
        console.log("--- Students ---");
        const students = await storage.getStudents();
        for (const s of students) {
            if (s.studentId.includes("C200")) {
                console.log(`- ${s.studentId} (${s.firstName} ${s.lastName}) | Grade: ${s.grade}`);
                const sub = await storage.getActiveSubscription(s.id);
                if (sub) {
                    console.log(`  [Active Sub] ${sub.planType} | Start: ${sub.startDate} | QB-Txn: ${sub.qbTransactionId}`);
                }
            }
        }

        console.log("\n--- Recent Webhook Logs ---");
        const logs = await storage.getRecentLogs(5);
        logs.filter(l => l.type === 'webhook').forEach(l => console.log(`- ${l.createdAt.toISOString()} | Details: ${JSON.stringify(l.details)}`));
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
check();
