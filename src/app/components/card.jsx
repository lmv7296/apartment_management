"use client";

import React, { useState } from "react";

export default function Card({ image, name, info, onOpenFull }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <>
      <div className='max-w-sm bg-white rounded-2xl shadow-lg overflow-hidden transform transition-transform hover:scale-105 hover:shadow-2xl'>
        <img src={image} alt={name} className='w-full h-48 object-cover' />
        <div className='p-5'>
          <h3 className='text-lg font-semibold text-gray-900'>{name}</h3>
          <p className='mt-2 text-sm text-gray-600 line-clamp-3'>{info}</p>
          <div className='mt-4 flex items-center justify-between'>
            <button
              onClick={openModal}
              className='inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300'>
              View Details
            </button>
            <button
              onClick={() => onOpenFull && onOpenFull(name)}
              className='text-xs text-indigo-600 hover:underline'>
              Open Full
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50'
          onClick={closeModal}>
          <div
            className='relative max-w-3xl w-full bg-white rounded-xl shadow-2xl overflow-hidden'
            onClick={(e) => e.stopPropagation()}>
            <button
              onClick={closeModal}
              aria-label='Close'
              className='absolute top-4 right-4 bg-white/80 hover:bg-white px-2 py-1 rounded-full text-gray-700 shadow'>
              ✕
            </button>
            <div className='w-full h-64 sm:h-80'>
              <img
                src={image}
                alt={name}
                className='w-full h-full object-cover'
              />
            </div>
            <div className='p-6'>
              <h2 className='text-2xl font-semibold text-gray-900'>{name}</h2>
              <p className='mt-3 text-gray-600'>{info}</p>
              <div className='mt-6'>
                <button
                  onClick={() => onOpenFull && onOpenFull(name)}
                  className='w-full inline-flex justify-center items-center px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300'>
                  Open Full View
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
