import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom"; // Import for extended matchers
import Home from "./Home"; // Adjust the path if necessary

test("renders Home component", () => {
  render(<Home />);

  // Example assertions
  expect(screen.getByText("User records")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Logout/i })).toBeInTheDocument();
});
