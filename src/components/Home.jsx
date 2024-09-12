import { useState, useEffect, useCallback } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  const [operation, setOperation] = useState("");
  const [operationFilter, setOperationFilter] = useState("");
  const [amount1, setAmount1] = useState("");
  const [amount2, setAmount2] = useState("");
  const [balance, setBalance] = useState("");
  const [operationsList, setOperationsList] = useState([]);
  const [operationLogs, setOperationLogs] = useState([]);
  const [resultOperation, setResultOperation] = useState("");
  const [isAmount2Disabled, setIsAmount2Disabled] = useState(false);
  const [isAmount1Disabled, setIsAmount1Disabled] = useState(false);

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const host = "https://fathomless-cove-02835-73af93fd2fad.herokuapp.com";
  const operationsURL = host + "/api/v0/operations";
  const recordsURL = host + "/api/v0/records";

  const SQUARE_ROOT_OPTION_ID = 5;
  const RANDOM_OPTION_ID = 6;

  const options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };

  useEffect(() => {
    const fetchOptionsList = async () => {
      try {
        const sessionUser = JSON.parse(localStorage.getItem("user"));
        const optionsURL = {
          ...options,
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + sessionUser.token,
          },
        };
        const response = await fetch(operationsURL, optionsURL);
        const data = await response.json();
        setOperationsList(data);
      } catch (e) {
        console.error(e);
      }
    };

    const fetchDefaultValue = async () => {
      setOperation("1");
    };

    fetchDefaultValue();
    fetchOptionsList();
  }, []);

  const fetchUserRecords = useCallback(async (page, size, filter = 0) => {
    setLoading(true);
    try {
      const sessionUser = JSON.parse(localStorage.getItem("user"));

      const optionsURL = {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + sessionUser.token,
        },
      };
      const response = await fetch(
        `${recordsURL}?userId=${sessionUser.id}&page=${page}&size=${size}&operationId=${filter}`,
        optionsURL
      );

      if (!response.ok) {
        throw new Error("Failed to fetch user records");
      }

      const data = await response.json();

      setTotalPages(data.totalPages || 0);
      setCurrentPage(data.currentPage || 0);
      setOperationLogs(data.content || []);

      if (data.content && data.content.length > 0) {
        setBalance(data.content[0].balance);
      } else {
        setBalance(sessionUser.balance || 0);
      }
    } catch (error) {
      setErrors((prevErrors) => ({ ...prevErrors, fetch: error.message }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const sessionUser = JSON.parse(localStorage.getItem("user"));
    if (!sessionUser) navigate("/");
    fetchUserRecords(currentPage, pageSize);
  }, [currentPage, pageSize]);

  const deleteRecord = async (id, cost) => {
    setLoading(true);
    try {
      const url = `${recordsURL}?id=${id}`;
      const sessionUser = JSON.parse(localStorage.getItem("user"));
      const response = await fetch(url, {
        ...options,
        Authorization: "Bearer " + sessionUser.token,
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete record");
      }

      await fetchUserRecords(currentPage, pageSize);
      setBalance(balance + cost);
    } catch (error) {
      console.error("Error deleting record:", error);
      setErrors((prevErrors) => ({ ...prevErrors, delete: error.message }));
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const handlePageSizeChange = (event) => {
    setPageSize(Number(event.target.value));
    setCurrentPage(0); // Reset to first page when page size changes
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    newErrors.message = "";
    setErrors(newErrors);
    const sessionUser = JSON.parse(localStorage.getItem("user"));

    const optionsPOST = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        user: sessionUser.id,
      },
      body: JSON.stringify({
        operationId: parseInt(operation),
        amount1: parseFloat(amount1),
        amount2: parseFloat(amount2),
      }),
    };

    try {
      const optionsRec = {
        ...optionsPOST,
        Authorization: "Bearer " + sessionUser.token,
      };
      const response = await fetch(recordsURL, optionsRec);
      if (response.status == 400) {
        const errorData = await response.json();
        setErrors({ message: errorData.message });
        setResultOperation(" Invalid operation ");
        throw new Error(errorData.message || "Failed to delete record");
      } else {
        const data = await response.json();
        localStorage.setItem(
          "user",
          JSON.stringify({ ...sessionUser, balance: data.balance })
        );
        setResultOperation(data.response);
        fetchUserRecords(currentPage, pageSize);
      }
    } catch (e) {
      console.error(e.message);
    }
  };

  const filterRecords = () => {
    fetchUserRecords(currentPage, pageSize, operationFilter);
  };

  const selectOperation = (value) => {
    setOperation(value);
    setIsAmount2Disabled(value >= SQUARE_ROOT_OPTION_ID);
    setAmount2(value >= SQUARE_ROOT_OPTION_ID ? "" : amount2);

    setIsAmount1Disabled(value == RANDOM_OPTION_ID);
    setAmount1(value == RANDOM_OPTION_ID ? "" : amount1);
  };

  return (
    <>
      <div className="logout-center-buttons">
        <button type="button" className="" onClick={handleLogout}>
          Logout
        </button>
      </div>
      <div className="login-main">
        <div className="login-right">
          <div className="home-container">
            <div className="login-center">
              <h3>User records</h3>
              <hr />
              <div className="row">
                <div>
                  <label>Filter operation: </label>
                  <select
                    className="smaller-select"
                    id="operationFilter"
                    value={operationFilter}
                    onChange={(e) => setOperationFilter(e.target.value)}
                  >
                    <option key="0" value="0">
                      none
                    </option>
                    {operationsList.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                  <button
                    className="btn btn-secondary"
                    onClick={() => filterRecords(currentPage, pageSize)}
                  >
                    Filter
                  </button>
                </div>
              </div>
              <div className="table-wrapper">
                <hr />
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th className="center-text">id</th>
                      <th className="center-text">Operation</th>
                      <th className="center-text">Balance</th>
                      <th className="center-text">Result</th>
                      <th className="center-text">Date</th>
                      <th className="center-text">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="center-text">
                          Loading...
                        </td>
                      </tr>
                    ) : !operationLogs.length ? (
                      <tr>
                        <td colSpan="6" className="center-text">
                          No logs available
                        </td>
                      </tr>
                    ) : (
                      operationLogs.map((log) => (
                        <tr key={log.id}>
                          <td>{log.id}</td>
                          <td>{log.operation.name}</td>
                          <td>{log.balance}</td>
                          <td>{log.response}</td>
                          <td>
                            {format(new Date(log.date), "yyyy-MM-dd HH:mm")}
                          </td>
                          <td>
                            <button
                              className="small-button"
                              onClick={() =>
                                deleteRecord(log.id, log.operation.cost)
                              }
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                <div className="center">
                  <button
                    className="small-button"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 0 || loading}
                  >
                    Previous
                  </button>
                  <span className="margin-10">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  <button
                    className="small-button"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages - 1 || loading}
                  >
                    Next
                  </button>

                  <select
                    onChange={handlePageSizeChange}
                    value={pageSize}
                    className="margin-10"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <span className="margin-10">Records per page</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="login-left">
          <div className="home-container">
            <div className="login-center">
              <h3>User balance: {balance}</h3>
              <hr />
              <form>
                <div>
                  <label>Operation: </label>
                  <select
                    className="inputkeyboard"
                    id="operation"
                    value={operation}
                    onChange={(e) => selectOperation(e.target.value)}
                  >
                    {operationsList.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="padding-16">
                  <label>Number #1: </label>
                  <input
                    className="inputkeyboard"
                    type="number"
                    id="amount1"
                    disabled={isAmount1Disabled}
                    value={amount1}
                    onChange={(e) => setAmount1(e.target.value)}
                  />
                </div>
                <div className="padding-16">
                  <label>Number #2: </label>
                  <input
                    className="inputkeyboard"
                    type="number"
                    id="amount2"
                    disabled={isAmount2Disabled}
                    value={amount2}
                    onChange={(e) => setAmount2(e.target.value)}
                  />
                </div>
                {errors.operation && <span>{errors.operation}</span>}
                {errors.message && <span>{errors.message}</span>}

                <div className="login-center-buttons">
                  <button
                    type="button"
                    className="button-round"
                    onClick={handleSubmit}
                  >
                    Calculate
                  </button>
                </div>
              </form>
              <br />
              <h3>Result: {resultOperation}</h3>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
