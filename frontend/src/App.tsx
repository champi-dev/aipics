import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ApolloProvider } from "@apollo/client";
import { apolloClient } from "./utils/apolloClient";
import { AuthProvider } from "./context/AuthContext";
import { Layout } from "./components/layout/Layout";
import { Home } from "./pages/Home";
import { Profile } from "./pages/Profile";
import { PostDetail } from "./pages/PostDetail";
import "./styles/global.css";

export function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <AuthProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/:username" element={<Profile />} />
              <Route path="/post/:id" element={<PostDetail />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </AuthProvider>
    </ApolloProvider>
  );
}
