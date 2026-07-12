import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { formatDate, titleCase, cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Audit Logs" };

const ACTION_COLORS: Record<string, string> = {
  profile_created: "bg-blue-100 text-blue-700",
  profile_approved: "bg-green-100 text-green-700",
  profile_rejected: "bg-red-100 text-red-700",
  profile_deleted: "bg-red-100 text-red-700",
  profile_deactivated: "bg-orange-100 text-orange-700",
  subscription_created: "bg-purple-100 text-purple-700",
  biodata_generated: "bg-gold/10 text-gold-dark border border-gold/20",
  biodata_downloaded: "bg-gold/10 text-gold-dark border border-gold/20",
  profile_shared: "bg-teal-100 text-teal-700",
  profile_viewed: "bg-gray-100 text-gray-600",
  login: "bg-gray-100 text-gray-500",
};

export default async function AuditLogsPage() {
  const supabase = await createClient();

  const { data: logs } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-navy-dark">Audit Logs</h1>
        <p className="text-gray-500 text-sm mt-1">Complete activity trail across the platform</p>
      </div>

      <div className="luxury-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Performed By</th>
                <th>Entity</th>
                <th>Date & Time</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {logs && logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <span className={cn("badge text-xs", ACTION_COLORS[log.action] || "bg-gray-100 text-gray-600")}>
                        {titleCase(log.action.replace(/_/g, " "))}
                      </span>
                    </td>
                    <td>
                      <p className="font-medium text-sm text-navy-dark">{log.actor_name}</p>
                    </td>
                    <td>
                      <p className="text-sm text-gray-600">{log.entity_name || log.entity_id}</p>
                      <p className="text-xs text-gray-400 capitalize">{log.entity_type}</p>
                    </td>
                    <td className="text-sm text-gray-500 whitespace-nowrap">
                      {formatDate(log.created_at, "dd MMM yyyy, HH:mm")}
                    </td>
                    <td>
                      <span className={cn("badge", log.actor_role === "admin" ? "badge-navy" : "badge-gray")}>
                        {titleCase(log.actor_role)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">No audit logs yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}