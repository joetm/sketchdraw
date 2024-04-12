import React, { useEffect, useState } from 'react';

const isProduction = process.env.NODE_ENV === 'production';

let Drawing = null;

if (!isProduction) {
  Drawing = require('react-drawing').default;
}

const DrawingWrapper = (props) => {
  const [LoadedDrawing, setLoadedDrawing] = useState(Drawing);

  useEffect(() => {
    if (isProduction) {
      import('react-drawing').then((module) => {
        setLoadedDrawing(module.default);
      });
    }
  }, []);

  if (!LoadedDrawing) {
    return null; // You can show a loading spinner or a placeholder here
  }

  return <LoadedDrawing {...props} />;
};

export default DrawingWrapper;
