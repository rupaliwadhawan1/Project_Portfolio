import { format } from 'date-fns';

export interface EmissionsData {
  vehicleType: string;
  co2e: number;
  timestamp: string;
}

// Standard emission factors based on UK government BEIS data (kg CO2e/km)
const EMISSION_FACTORS = {
  'Small Car': 0.14231,
  'Medium Car': 0.17355,
  'Large Car': 0.21424,
};

const VEHICLE_TYPES = ['Small Car', 'Medium Car', 'Large Car'];

function calculateEmissionsForVehicle(vehicleType: string, distance: number): number {
  const emissionFactor = EMISSION_FACTORS[vehicleType as keyof typeof EMISSION_FACTORS];
  if (!emissionFactor) {
    console.warn(`No emission factor available for ${vehicleType}. Using default.`);
    return 0.15 * distance; // Default emission factor
  }
  return emissionFactor * distance;
}

export async function calculateEmissions(trafficDensity: number): Promise<EmissionsData[]> {
  // Validate traffic density and set default if invalid
  if (typeof trafficDensity !== 'number' || isNaN(trafficDensity)) {
    console.warn("Invalid traffic density; defaulting to 50.");
    trafficDensity = 50; // Default to medium traffic
  }

  // Calculate base distance based on traffic density (10-50km range)
  const baseDistance = Math.max(10, Math.min(50, 50 * (trafficDensity / 100)));

  return VEHICLE_TYPES.map(vehicleType => ({
    vehicleType,
    co2e: calculateEmissionsForVehicle(vehicleType, baseDistance),
    timestamp: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss'Z'")
  }));
}

async function fetchDataWithRateLimiting(
  apiUrl: string,
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<any> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(apiUrl);
      if (response.ok) return await response.json();

      if (response.status === 429) {
        console.warn(`Rate limit exceeded. Retrying in ${retryDelay * (attempt + 1)} ms.`);
        await new Promise(res => setTimeout(res, retryDelay * (attempt + 1)));
      } else {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed: ${error}`);
    }
  }
  throw new Error("Max retries exceeded");
}

function calculateHeight(data: number | undefined): string {
  // Ensure valid data and fallback to default
  return isNaN(data as number) ? '10' : data?.toString() || '10';
}

// Example usage of calculateHeight
const exampleHeight = calculateHeight(NaN); // Fallback to '10' if NaN
console.log(`<rect height="${exampleHeight}" />`);

// Example usage of emissions calculation
(async () => {
  try {
    const emissionsData = await calculateEmissions(70); // Example with traffic density of 70
    console.log(emissionsData);

    const apiData = await fetchDataWithRateLimiting('https://example.com/api', 5, 2000);
    console.log(apiData);
  } catch (error) {
    console.error("Error fetching data:", error);
  }
})();
