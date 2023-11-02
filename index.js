import { render } from './example/solidjs';

import diagram from '/radul-2009-figure-5-8.svg';
import './index.css';

const img = document.createElement('img')
img.setAttribute('src', diagram);
document.body.appendChild(img);

render(document.body);
