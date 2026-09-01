/** @import { StarRatingOptions } from './star-rating.js'; */

import { initComponent } from '@fr0st/ui';
import StarRating from './star-rating.js';

// StarRating default options
/** @type {StarRatingOptions} */
StarRating.defaults = {
    size: 'md',
    min: 0,
    max: null,
    step: 1,
    stars: 5,
    ratingText(rating) {
        return rating === 1 ?
            `${rating} ${this.constructor.lang.star}` :
            `${rating} ${this.constructor.lang.stars}`;
    },
    tooltip: true,
    hover: true,
    animate: true,
    displayOnly: false,
};

// StarRating classes
StarRating.classes = {
    animate: 'starrating-animate',
    container: 'starrating',
    disabled: 'starrating-disabled',
    filled: 'starrating-filled',
    hide: 'visually-hidden',
    outline: 'starrating-outline',
};

// StarRating icons
StarRating.icons = {
    filled: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" focusable="false" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2L9.19 8.62L2 9.24l5.45 4.73L5.82 21L12 17.27z" fill="currentColor"/></svg>',
    outline: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" focusable="false" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><path d="M12 15.39l-3.76 2.27l.99-4.28l-3.32-2.88l4.38-.37L12 6.09l1.71 4.04l4.38.37l-3.32 2.88l.99 4.28M22 9.24l-7.19-.61L12 2L9.19 8.63L2 9.24l5.45 4.73L5.82 21L12 17.27L18.18 21l-1.64-7.03L22 9.24z" fill="currentColor"/></svg>',
};

// StarRating lang
StarRating.lang = {
    star: 'star',
    stars: 'stars',
};

// StarRating init
initComponent('starrating', StarRating);

export default StarRating;
