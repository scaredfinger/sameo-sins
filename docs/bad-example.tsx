

import React, { useState, useEffect, useMemo } from 'react';
import { useApolloClient, useQuery } from '@apollo/client';
import { GET_DATA_QUERY } from './queries';

const BadExampleComponent = ({ initialData }) => {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('');
  const [dataFromApollo, setDataFromApollo] = useState(null);
  const [loadingFromApollo, setLoadingFromApollo] = useState(false);
  const [errorFromApollo, setErrorFromApollo] = useState(null);
  const [additionalState, setAdditionalState] = useState([]);
  const [complexState, setComplexState] = useState({ key: 'value' });
  const [moreComplexState, setMoreComplexState] = useState([1, 2, 3, 4, 5]);

  const apolloClient = useApolloClient();

  useEffect(() => {
    document.title = `Count: ${count}`;
  }, [count]);

  useEffect(() => {
    // Simulate a long-running task that updates state
    const timer = setTimeout(() => {
      setCount(count + 1);
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [count]);

  useEffect(() => {
    // Simulate a network request that updates state
    setLoadingFromApollo(true);

    apolloClient
      .query({
        query: GET_DATA_QUERY,
        variables: { name },
      })
      .then((result) => {
        setDataFromApollo(result.data);
        setLoadingFromApollo(false);
      })
      .catch((err) => {
        setErrorFromApollo(err);
        setLoadingFromApollo(false);
      });
  }, [name, apolloClient]);

  const handleInputChange = (e) => {
    setName(e.target.value);
  };

  const handleButtonClick = () => {
    setCount(count + 1);

    // Simulate a network request using apolloClient
    apolloClient.query({
      query: GET_DATA_QUERY,
      variables: { name },
    });

    // Update additional state
    setAdditionalState([...additionalState, count]);
  };

  const handleComplexStateUpdate = () => {
    // Simulate a complex state update
    const updatedComplexState = { ...complexState, newKey: 'newValue' };
    setComplexState(updatedComplexState);
  };

  const handleMoreComplexStateUpdate = () => {
    // Simulate a more complex state update
    const updatedMoreComplexState = [...moreComplexState, count];
    setMoreComplexState(updatedMoreComplexState);
  };

  const renderData = useMemo(() => {
    if (loadingFromApollo) {
      return <p>Loading...</p>;
    }
    if (errorFromApollo) {
      return <p>Error: {errorFromApollo.message}</p>;
    }
    return (
      <div>
        <p>Name: {dataFromApollo && dataFromApollo.name}</p>
        <p>Count: {count}</p>
      </div>
    );
  }, [loadingFromApollo, errorFromApollo, dataFromApollo, count]);

  return (
    <div>
      <h1>Bad Example Component</h1>
      <input type="text" value={name} onChange={handleInputChange} />
      <button onClick={handleButtonClick}>Increment Count</button>
      <button onClick={handleComplexStateUpdate}>Update Complex State</button>
      <button onClick={handleMoreComplexStateUpdate}>Update More Complex State</button>
      {renderData}
      <div>
      <h2>This is a long section of explicit inline markup</h2>
      <p>Its intentionally verbose to make an impact</p>
      <ul>
        <li>Item 1</li>
        <li>Item 2</li>
        <li>Item 3</li>
        <li>Item 4</li>
        <li>Item 5</li>
      </ul>
      <p>End of explicit inline markup</p>
    </div>
    </div>
  );
};

export default BadExampleComponent;
