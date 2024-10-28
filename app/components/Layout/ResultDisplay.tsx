import React from 'react';

interface MatchedContent {
  content: string[];
}

interface ResultDisplayProps {
  apiResult: MatchedContent[];
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ apiResult }) => {
  return (
    <div 
      style={{
        margin: '0px 0',
        alignItems: 'flex-start',
        minHeight: '50vh',
      }}
    >
      <h2 style={{ fontWeight: 'bold', backgroundColor: '#f0e68c', padding: '10px', borderRadius: '5px' }}>肺判定</h2>
      {apiResult ? (
        <ul style={{ listStyleType: 'none', padding: 0}}>
          {apiResult.map((matchedItem, index) => (
            <li 
              key={index} 
              style={{
                margin: '12px 0',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <div 
                style={{
                  marginBottom: '1.5em',
                  padding: '1em',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '8px',
                }}
              >
                {matchedItem.content.map((content, contentIndex) => (
                  <p 
                    key={contentIndex} 
                    style={{
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.2,
                      marginBottom: '-0.5em',
                    }}
                  >
                    {content}
                  </p>
                ))}
              </div>
              {index < apiResult.length - 1 && 
                <hr
                  style={{
                    margin: '2em 0',
                    border: 'none',
                    borderTop: '2px solid #ccc',
                  }}
               />}
            </li>
          ))}
        </ul>
      ) : (
        <p>関連する情報が見つかりませんでした</p>
      )}
    </div>
  );
};

export default ResultDisplay;
