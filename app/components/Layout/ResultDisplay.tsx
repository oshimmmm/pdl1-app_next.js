import React from 'react';
import styles from '../../../app/style/style.module.css';

interface MatchedContent {
  content: string[];
}

interface ResultDisplayProps {
  apiResult: MatchedContent[];
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ apiResult }) => {
  return (
    <div className={styles.resultContainer}>
      {apiResult ? (
        <ul className={styles.resultList}>
          {apiResult.map((matchedItem, index) => (
            <li key={index} className={styles.resultItem}>
              <div className={styles.matchedContentContainer}>
                {matchedItem.content.map((content, contentIndex) => (
                  <p key={contentIndex} className={styles.preWrapText}>{content}</p>
                ))}
              </div>
              {index < apiResult.length - 1 && <hr className={styles.divider} />}
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
