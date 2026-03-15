export default function LogoMark({ size = "md" }) {
  const sizeClass = {
    sm: "h-8 w-8",
    md: "h-9 w-9 sm:h-10 sm:w-10",
    lg: "h-11 w-11 sm:h-12 sm:w-12",
  };

  function renderVariant() {
    return (
      <svg
        className='logo-glyph'
        viewBox='0 0 50 50'
        xmlns='http://www.w3.org/2000/svg'
        aria-hidden='true'>
        <path
          fill='currentColor'
          d='M12 8C5.937 8 1 12.937 1 19v22a1 1 0 0 0 1 1h36c6.063 0 11-4.937 11-11V9a1 1 0 0 0-1-1zm0 2h35v21c0 4.983-4.017 9-9 9H3V19c0-4.983 4.017-9 9-9m4.043 8-5.16 14h2.197l1.404-4h5.067l1.404 4h2.2l-5.16-14zM25 18v14h2v-9.924L31.182 32h1.693L37 22.172V32h2V18h-2.297l-4.676 11.225L27.337 18zm-7.982 2.766.097.271L18.855 26h-3.673z'
        />
      </svg>
    );
  }

  return (
    <div className={`${sizeClass[size] || sizeClass.md} logo-box`}>
      {renderVariant()}
    </div>
  );
}
