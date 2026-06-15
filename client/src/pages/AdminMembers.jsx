import { ChevronLeft, ChevronRight, Pencil, Save, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";

const pageSize = 10;

export default function AdminMembers() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);

  async function load() {
    const data = await api("/users");
    setUsers(data.users);
  }

  useEffect(() => {
    load();
  }, []);

  const filteredUsers = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    return users.filter((user) => {
      const matchesQuery = !lowered || `${user.name} ${user.email}`.toLowerCase().includes(lowered);
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      return matchesQuery && matchesRole;
    });
  }, [users, query, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const pageUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);
  const memberCount = users.filter((user) => user.role === "member").length;
  const adminCount = users.filter((user) => user.role === "admin").length;

  function changeFilter(next) {
    next();
    setPage(1);
  }

  async function saveUser() {
    setMessage("");
    await api(`/users/${selectedUser.id}`, { method: "PUT", body: JSON.stringify(selectedUser) });
    setMessage("Member updated.");
    setSelectedUser(null);
    await load();
  }

  async function deleteUser(id) {
    setMessage("");
    try {
      await api(`/users/${id}`, { method: "DELETE" });
      setMessage("Member deleted.");
      if (selectedUser?.id === id) setSelectedUser(null);
      await load();
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <section className="section py-16">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-byte-maroon">Admin</p>
      <h1 className="mt-4 text-4xl font-black">Member Management</h1>
      <p className="mt-4 max-w-3xl text-sm leading-6 text-byte-graphite">Search, filter, and manage registered members without stacking long card lists.</p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Stat label="Total users" value={users.length} />
        <Stat label="Members" value={memberCount} />
        <Stat label="Admins" value={adminCount} />
      </div>

      <div className="panel mt-6 p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
          <label className="relative block">
            <Search className="absolute left-3 top-3.5 text-byte-graphite" size={18} />
            <input
              className="field"
              style={{ paddingLeft: "2.75rem" }}
              placeholder="Search name or email"
              value={query}
              onChange={(event) => changeFilter(() => setQuery(event.target.value))}
            />
          </label>
          <select className="field" value={roleFilter} onChange={(event) => changeFilter(() => setRoleFilter(event.target.value))}>
            <option value="all">All roles</option>
            <option value="member">Members</option>
            <option value="admin">Admins</option>
          </select>
        </div>
        {message && <p className="mt-4 border border-byte-line bg-byte-ash p-3 text-sm font-semibold text-byte-maroon">{message}</p>}
      </div>

      <div className="panel mt-6 overflow-hidden">
        <div className="hidden grid-cols-[80px_1.2fr_1.5fr_140px_180px_110px] border-b border-byte-line bg-byte-black px-4 py-3 text-xs font-bold uppercase tracking-wide text-white lg:grid">
          <span>ID</span>
          <span>Name</span>
          <span>Email</span>
          <span>Role</span>
          <span>Registered</span>
          <span>Actions</span>
        </div>

        {pageUsers.map((user) => (
          <div key={user.id} className="grid gap-3 border-b border-byte-line px-4 py-4 last:border-b-0 lg:grid-cols-[80px_1.2fr_1.5fr_140px_180px_110px] lg:items-center">
            <p className="text-sm font-bold">#{user.id}</p>
            <div>
              <p className="font-bold">{user.name}</p>
              <p className="text-xs text-byte-graphite lg:hidden">{user.email}</p>
            </div>
            <p className="hidden text-sm text-byte-graphite lg:block">{user.email}</p>
            <span className="w-fit border border-byte-line bg-byte-ash px-3 py-1 text-xs font-bold uppercase">{user.role}</span>
            <p className="text-sm text-byte-graphite">{new Date(user.created_at).toLocaleDateString()}</p>
            <div className="flex gap-2">
              <button className="btn-secondary px-3 py-2" onClick={() => setSelectedUser(user)} aria-label="Edit member"><Pencil size={16} /></button>
              <button className="btn-secondary px-3 py-2" onClick={() => deleteUser(user.id)} aria-label="Delete member"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}

        {!pageUsers.length && <div className="p-6 text-sm text-byte-graphite">No members match the current filter.</div>}
      </div>

      <div className="mt-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-sm text-byte-graphite">Showing {pageUsers.length} of {filteredUsers.length} users</p>
        <div className="flex items-center gap-2">
          <button className="btn-secondary px-3 py-2" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft size={16} /></button>
          <span className="px-3 text-sm font-bold">Page {page} / {totalPages}</span>
          <button className="btn-secondary px-3 py-2" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}><ChevronRight size={16} /></button>
        </div>
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/30">
          <div className="ml-auto h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-enterprise">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black">Edit Member</h2>
              <button className="btn-secondary px-3 py-2" onClick={() => setSelectedUser(null)} aria-label="Close editor"><X size={16} /></button>
            </div>
            <div className="mt-6 grid gap-4">
              <input className="field" value={selectedUser.name} onChange={(event) => setSelectedUser({ ...selectedUser, name: event.target.value })} />
              <input className="field" value={selectedUser.email} onChange={(event) => setSelectedUser({ ...selectedUser, email: event.target.value })} />
              <select className="field" value={selectedUser.role} onChange={(event) => setSelectedUser({ ...selectedUser, role: event.target.value })}>
                <option value="member">member</option>
                <option value="admin">admin</option>
              </select>
              <p className="text-sm text-byte-graphite">Registered: {new Date(selectedUser.created_at).toLocaleString()}</p>
            </div>
            <div className="mt-8 flex gap-3">
              <button className="btn-primary" onClick={saveUser}><Save size={18} />Save Changes</button>
              <button className="btn-secondary" onClick={() => deleteUser(selectedUser.id)}><Trash2 size={18} />Delete</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="panel p-5">
      <p className="text-3xl font-black text-byte-maroon">{value}</p>
      <p className="mt-1 text-sm font-semibold text-byte-graphite">{label}</p>
    </div>
  );
}
