import Header from "./Header";

export default function AppContainer({ children }) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}
