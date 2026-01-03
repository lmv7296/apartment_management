"use client";

import Link from "next/link";
import Header from "./components/header";
import Card from "./components/card";
import React from "react";

const features = [
  {
    id: 1,
    title: "Centralized Contracts",
    desc: "Store, version and e-sign lease documents for every unit.",
  },
  {
    id: 2,
    title: "Maintenance Queue",
    desc: "Track requests, assign vendors, and monitor costs.",
  },
  {
    id: 3,
    title: "Tenant Records",
    desc: "One place for contact info, payment history and documents.",
  },
  {
    id: 4,
    title: "Payments & Accounting",
    desc: "Collect rent, reconcile payments and export reports.",
  },
  {
    id: 5,
    title: "Multi-Admin Access",
    desc: "Granular roles and permissions for teams and vendors.",
  },
  {
    id: 6,
    title: "Reports & Exports",
    desc: "Financial, maintenance and occupancy reports ready for export.",
  },
];

export default function Home() {
  // const [data, setData] = React.useState(null);
  // console.log(data);
  // React.useEffect(() => {
  //   async function fetchData() {
  //     // Call your Next.js API route using a relative path
  //     const response = await fetch("/api/listings");
  //     const result = await response.json();
  //     setData(result);
  //   }

  //   fetchData();
  // }, []);
  // // const posts = await data.json();
  // const items = Array.isArray(data)
  //   ? data.map((p) => ({
  //       id: p.id,
  //       image: p.image,
  //       title: p.name,
  //       info: `${p.bedrooms} bd • ${p.bathrooms} ba • ${p.squareFeet} sqft`,
  //       price:
  //         p.type === "rent"
  //           ? `$${p.price}/mo`
  //           : `$${new Intl.NumberFormat().format(p.price)}`,
  //     }))
  //   : [];

  return (
    <>
      <Header />

      <main className="max-w-4xl mx-auto p-6">
        <section className="text-center py-12">
          <h1 className="text-4xl font-bold mb-4">Portfolio Admin Platform</h1>
          <p className="text-lg text-gray-600 mb-6">
            Built for landlords and property managers who operate many units —
            centralize contracts, tenants, maintenance and payments across your
            entire portfolio.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/demo"
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Request Demo
            </Link>
            <Link href="/signup" className="px-4 py-2 border rounded">
              Create Account
            </Link>
            <Link href="/docs" className="px-4 py-2 border rounded">
              Documentation
            </Link>
          </div>
        </section>
        {/* 
        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-4 text-center">
            my Apartments
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <Card
                key={item.id}
                image={item.image}
                name={item.title}
                info={`${item.info} • ${item.price}`}
                onOpenFull={(name) => console.log("Open full view:", name)}
              />
            ))}
          </div>
        </section> */}

        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-4 text-center">
            What it does for your team
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((f) => (
              <div key={f.id} className="border rounded p-4 shadow-sm">
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 text-center">
          <h2 className="text-xl font-semibold mb-2">Security & Scale</h2>
          <p className="text-gray-600 mb-4">
            Role-based access, audit logs, and data export tools let multiple
            admins and vendors collaborate safely at scale.
          </p>
        </section>
      </main>

      <footer className="py-8 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Apartment Management
      </footer>
    </>
  );
}
