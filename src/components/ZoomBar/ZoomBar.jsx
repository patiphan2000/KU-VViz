import React from 'react';
import { useState } from 'react';

import styles from './ZoomBar.module.css'

function ZoomBar({setScale}) {
    const [value, setValue] = useState(75);
    const MAX = 100;
    const getBackgroundSize = () => {
        return {
            backgroundSize: `${((value * 100) / MAX)}% 100%`,
        };
    };

    const setEveValue = (value) => {
        setValue(value);
        setScale(value);
    }

    return (
        <div className={styles.zoom_container}>
            <input
                type="range"
                min="1"
                max={MAX}
                onChange={(e) => setEveValue(e.target.value)}
                style={getBackgroundSize()}
                value={value}
            />
            <p className={styles.scale_label}>{value + 'x'}</p>
        </div>
    )
}

export default ZoomBar