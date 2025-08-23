import React from 'react';
import { Helmet } from 'react-helmet';

interface SEOProps {
  title: string;
  description: string;
  image: string;
  url: string;
  type?: 'website' | 'product';
  price?: number;
  currency?: string;
}

/**
 * SEO Component for managing meta tags
 * Provides both Open Graph and Twitter Cards meta tags
 */
export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  image,
  url,
  type = 'website',
  price,
  currency = 'EUR'
}) => {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={url} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:site_name" content="KORAUTO" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={type === 'product' ? `${title} - Car Image` : 'KORAUTO Logo - Premium Cars from South Korea'} />
      <meta property="og:locale" content="en_US" />
      {price && <meta property="product:price:amount" content={price.toString()} />}
      {price && <meta property="product:price:currency" content={currency} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@korauto" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={type === 'product' ? `${title} - Car Image` : 'KORAUTO Logo - Premium Cars from South Korea'} />
      
      {/* Additional SEO */}
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
    </Helmet>
  );
};