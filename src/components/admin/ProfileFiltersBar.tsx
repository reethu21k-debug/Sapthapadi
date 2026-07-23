"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, X, Search, MapPin, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const RELIGIONS = ["Hindu", "Muslim", "Christian", "Sikh", "Jain", "Buddhist", "Other"];
const CASTES = ["Modollu (Modikallu)", "Namdarlu (Namdharis)"];
const STATES = [
  "Andhra Pradesh", "Telangana", "Tamil Nadu", "Karnataka", "Kerala",
  "Maharashtra", "Gujarat", "Rajasthan", "Delhi", "Other",
];
const AP_DISTRICTS = [
  "Alluri Sitharama Raju", "Anakapalli", "Ananthapuramu", "Annamayya", "Bapatla",
  "Chittoor", "Dr. B.R. Ambedkar Konaseema", "East Godavari", "Eluru", "Guntur",
  "Kakinada", "Krishna", "Kurnool", "Markapuram", "Nandyal", "NTR", "Palnadu",
  "Parvathipuram Manyam", "Polavaram", "Prakasam", "Sri Potti Sriramulu Nellore",
  "Sri Sathya Sai", "Srikakulam", "Tirupati", "Visakhapatnam", "Vizianagaram",
  "West Godavari", "YSR Kadapa",
];
const OTHER_DISTRICT = "__other__";

export function ProfileFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedDistrictParam = searchParams.get("district") || "";
  const [showCustomDistrict, setShowCustomDistrict] = useState(
    selectedDistrictParam !== "" && !AP_DISTRICTS.includes(selectedDistrictParam)
  );

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  const clearAll = () => router.push("?");
  const hasFilters = searchParams.toString() !== "";

  const selectedState = searchParams.get("state") || "";
  const selectedDistrict = selectedDistrictParam;

  // Helper to check if a specific filter is currently active for styling
  const isActive = (paramName: string) => Boolean(searchParams.get(paramName));

  const getSelectClass = (paramName: string) =>
    cn(
      "text-xs font-medium border rounded-xl px-3 py-2 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-gold/40 cursor-pointer shadow-2xs appearance-none pr-7 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%22%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:14px_14px] bg-[position:right_8px_center] bg-no-repeat",
      isActive(paramName)
        ? "bg-gold/15 border-gold/50 text-navy-dark font-semibold shadow-xs"
        : "bg-gray-50/80 border-gray-200/80 text-gray-700 hover:bg-white hover:border-gray-300"
    );

  return (
    <div className="luxury-card p-4 md:p-5 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-4">
      {/* Top Bar: Title & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2 text-navy-dark font-serif font-bold">
          <div className="p-1.5 rounded-lg bg-gold/10 text-gold-dark">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <span>Filter Registry</span>
          {hasFilters && (
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-sans font-bold bg-navy-dark text-gold">
              Active
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {/* Search Input with Icon */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <input
              type="search"
              placeholder="Search by name or ID..."
              defaultValue={searchParams.get("search") || ""}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  updateFilter("search", (e.target as HTMLInputElement).value);
                }
              }}
              className={cn(
                "w-full text-xs font-medium border rounded-xl pl-9 pr-3 py-2 transition-all focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold shadow-2xs",
                isActive("search")
                  ? "bg-gold/10 border-gold/40 text-navy-dark placeholder:text-gray-500"
                  : "bg-gray-50/80 border-gray-200/80 text-gray-800 placeholder:text-gray-400 hover:bg-white"
              )}
            />
          </div>

          {/* Reset All Filters Button */}
          {hasFilters && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={clearAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-600 hover:bg-rose-600 hover:text-white text-xs font-semibold transition-all shadow-2xs whitespace-nowrap"
            >
              <X className="w-3.5 h-3.5" />
              Reset All
            </motion.button>
          )}
        </div>
      </div>

      {/* Main Filter Dropdowns Grid */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <select
          value={searchParams.get("gender") || ""}
          onChange={(e) => updateFilter("gender", e.target.value)}
          className={getSelectClass("gender")}
        >
          <option value="">All Genders</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>

        <select
          value={searchParams.get("status") || ""}
          onChange={(e) => updateFilter("status", e.target.value)}
          className={getSelectClass("status")}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="deactivated">Deactivated</option>
          <option value="suspended">Suspended</option>
        </select>

        <select
          value={searchParams.get("verified") || ""}
          onChange={(e) => updateFilter("verified", e.target.value)}
          className={getSelectClass("verified")}
        >
          <option value="">Verification (All)</option>
          <option value="true">Verified Only ✓</option>
          <option value="false">Unverified Only</option>
        </select>

        {/* Subscription Filter */}
        <select
          value={searchParams.get("subscription") || ""}
          onChange={(e) => updateFilter("subscription", e.target.value)}
          className={getSelectClass("subscription")}
        >
          <option value="">All Subscriptions</option>
          <option value="unsubscribed">Unsubscribed</option>
          <option value="six_months">6 Months</option>
          <option value="one_year">1 Year</option>
          <option value="premium">Premium</option>
          <option value="vip">VIP</option>
        </select>

        <div className="h-5 w-px bg-gray-200 hidden sm:block mx-0.5" />

        <select
          value={searchParams.get("religion") || ""}
          onChange={(e) => updateFilter("religion", e.target.value)}
          className={getSelectClass("religion")}
        >
          <option value="">All Religions</option>
          {RELIGIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        <select
          value={searchParams.get("caste") || ""}
          onChange={(e) => updateFilter("caste", e.target.value)}
          className={getSelectClass("caste")}
        >
          <option value="">All Communities</option>
          {CASTES.map((c) => (
            <option key={c} value={c.split(" (")[0]}>{c}</option>
          ))}
        </select>

        <select
          value={searchParams.get("marital_status") || ""}
          onChange={(e) => updateFilter("marital_status", e.target.value)}
          className={getSelectClass("marital_status")}
        >
          <option value="">Marital Status (All)</option>
          <option value="never_married">Never Married</option>
          <option value="divorced">Divorced</option>
          <option value="widowed">Widowed</option>
        </select>

        <div className="h-5 w-px bg-gray-200 hidden sm:block mx-0.5" />

        {/* Age Range Filter */}
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min={18}
            max={100}
            placeholder="Age min"
            defaultValue={searchParams.get("age_min") || ""}
            onKeyDown={(e) => {
              if (e.key === "Enter") updateFilter("age_min", (e.target as HTMLInputElement).value);
            }}
            onBlur={(e) => updateFilter("age_min", e.target.value)}
            className={cn(
              "w-20 text-xs font-medium border rounded-xl px-3 py-2 transition-all focus:outline-none focus:ring-2 focus:ring-gold/40 shadow-2xs",
              isActive("age_min")
                ? "bg-gold/10 border-gold/40 text-navy-dark"
                : "bg-gray-50/80 border-gray-200/80 text-gray-800 placeholder:text-gray-400 hover:bg-white"
            )}
          />
          <span className="text-xs text-gray-400">–</span>
          <input
            type="number"
            min={18}
            max={100}
            placeholder="Age max"
            defaultValue={searchParams.get("age_max") || ""}
            onKeyDown={(e) => {
              if (e.key === "Enter") updateFilter("age_max", (e.target as HTMLInputElement).value);
            }}
            onBlur={(e) => updateFilter("age_max", e.target.value)}
            className={cn(
              "w-20 text-xs font-medium border rounded-xl px-3 py-2 transition-all focus:outline-none focus:ring-2 focus:ring-gold/40 shadow-2xs",
              isActive("age_max")
                ? "bg-gold/10 border-gold/40 text-navy-dark"
                : "bg-gray-50/80 border-gray-200/80 text-gray-800 placeholder:text-gray-400 hover:bg-white"
            )}
          />
        </div>

        {/* Birth Year Filter */}
        <input
          type="number"
          min={1940}
          max={new Date().getFullYear()}
          placeholder="Birth year"
          defaultValue={searchParams.get("dob_year") || ""}
          onKeyDown={(e) => {
            if (e.key === "Enter") updateFilter("dob_year", (e.target as HTMLInputElement).value);
          }}
          onBlur={(e) => updateFilter("dob_year", e.target.value)}
          className={cn(
            "w-24 text-xs font-medium border rounded-xl px-3 py-2 transition-all focus:outline-none focus:ring-2 focus:ring-gold/40 shadow-2xs",
            isActive("dob_year")
              ? "bg-gold/10 border-gold/40 text-navy-dark"
              : "bg-gray-50/80 border-gray-200/80 text-gray-800 placeholder:text-gray-400 hover:bg-white"
          )}
        />

        <div className="h-5 w-px bg-gray-200 hidden sm:block mx-0.5" />

        {/* Location Section */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedState}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams.toString());
              if (e.target.value) {
                params.set("state", e.target.value);
              } else {
                params.delete("state");
              }
              params.delete("district");
              params.delete("page");
              setShowCustomDistrict(false);
              router.push(`?${params.toString()}`);
            }}
            className={getSelectClass("state")}
          >
            <option value="">All States</option>
            {STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {selectedState === "Andhra Pradesh" && (
            <Fragment key="ap-district-filter">
              <select
                value={showCustomDistrict ? OTHER_DISTRICT : selectedDistrict}
                onChange={(e) => {
                  if (e.target.value === OTHER_DISTRICT) {
                    setShowCustomDistrict(true);
                    updateFilter("district", "");
                  } else {
                    setShowCustomDistrict(false);
                    updateFilter("district", e.target.value);
                  }
                }}
                className={getSelectClass("district")}
              >
                <option value="">All AP Districts</option>
                {AP_DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
                <option value={OTHER_DISTRICT}>Other (type manually)...</option>
              </select>

              <AnimatePresence>
                {showCustomDistrict && (
                  <motion.div
                    initial={{ opacity: 0, width: 0, scale: 0.95 }}
                    animate={{ opacity: 1, width: "auto", scale: 1 }}
                    exit={{ opacity: 0, width: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="relative flex items-center overflow-hidden"
                  >
                    <MapPin className="absolute left-2.5 w-3 h-3 text-gold-dark pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Type district + Enter..."
                      defaultValue={selectedDistrict}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          updateFilter("district", (e.target as HTMLInputElement).value);
                        }
                      }}
                      className="text-xs font-semibold bg-gold/10 border border-gold/50 rounded-xl pl-7 pr-3 py-2 text-navy-dark placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gold w-44 shadow-2xs"
                      autoFocus
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </Fragment>
          )}
        </div>
      </div>
    </div>
  );
}