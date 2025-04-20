import { Redirect } from "wouter";
import { useAuth } from "../hooks/use-auth";

export default function ProtectedRoute({ component: Component, ...rest }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  return <Component {...rest} />;
}