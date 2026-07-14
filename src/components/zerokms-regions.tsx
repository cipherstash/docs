import { ZEROKMS_REGIONS } from "@/lib/zerokms-regions";

/**
 * Renders the supported ZeroKMS regions. Used by every page that lists regions
 * so the list is maintained in exactly one place (`@/lib/zerokms-regions`).
 */
export function ZeroKmsRegions() {
  return (
    <table>
      <thead>
        <tr>
          <th>Area</th>
          <th>Location</th>
          <th>Region identifier</th>
        </tr>
      </thead>
      <tbody>
        {ZEROKMS_REGIONS.map((region) => (
          <tr key={region.id}>
            <td>{region.area}</td>
            <td>{region.location}</td>
            <td>
              <code>{region.id}</code>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
