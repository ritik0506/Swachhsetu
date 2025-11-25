const Report = require('../models/Report');

/**
 * Geospatial Context Service
 * Provides geographic context for reports (ward, nearby reports, etc.)
 */
class GeospatialService {
  /**
   * Get nearby reports
   * @param {Array} coordinates - [longitude, latitude]
   * @param {number} radiusInMeters - Search radius in meters
   * @param {number} limit - Max number of reports to return
   * @returns {Promise<object>} Nearby reports and statistics
   */
  async getNearbyReports(coordinates, radiusInMeters = 500, limit = 10) {
    try {
      const [lng, lat] = coordinates;

      // Find reports within radius
      const nearbyReports = await Report.find({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat]
            },
            $maxDistance: radiusInMeters
          }
        }
      })
      .limit(limit)
      .select('category severity status createdAt location title')
      .lean();

      // Calculate statistics
      const stats = {
        total: nearbyReports.length,
        byCategory: {},
        bySeverity: {},
        byStatus: {},
        recentCount: 0 // Reports in last 7 days
      };

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      nearbyReports.forEach(report => {
        // Category stats
        stats.byCategory[report.category] = (stats.byCategory[report.category] || 0) + 1;
        
        // Severity stats
        stats.bySeverity[report.severity] = (stats.bySeverity[report.severity] || 0) + 1;
        
        // Status stats
        stats.byStatus[report.status] = (stats.byStatus[report.status] || 0) + 1;
        
        // Recent count
        if (report.createdAt > sevenDaysAgo) {
          stats.recentCount++;
        }
      });

      return {
        success: true,
        nearbyReports,
        stats,
        radius: radiusInMeters
      };

    } catch (error) {
      console.error('Error getting nearby reports:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get ward/zone information from coordinates
   * This is a placeholder - implement based on your city's ward boundaries
   * You can use:
   * - GeoJSON polygon matching
   * - Reverse geocoding API
   * - Pre-defined ward boundaries in DB
   */
  async getWardInfo(coordinates) {
    try {
      const [lng, lat] = coordinates;

      // TODO: Implement ward lookup based on your city's data
      // Options:
      // 1. Store ward boundaries as GeoJSON in MongoDB
      // 2. Use external geocoding API (Google Maps, OpenStreetMap)
      // 3. Use pre-computed ward assignments

      // Placeholder implementation
      return {
        success: true,
        ward: {
          id: 'WARD_001', // Replace with actual ward lookup
          name: 'Ward 1',
          zone: 'Zone A',
          officer: null // Can add ward officer info
        },
        note: 'Ward lookup not implemented - using placeholder'
      };

    } catch (error) {
      console.error('Error getting ward info:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Enrich report with geospatial context
   * @param {object} report - Report data with location
   * @returns {Promise<object>} Enriched context
   */
  async enrichReportContext(report) {
    if (!report.location || !report.location.coordinates) {
      return {
        success: false,
        error: 'No location data in report'
      };
    }

    try {
      const coordinates = report.location.coordinates;

      // Get nearby reports and ward info in parallel
      const [nearbyData, wardData] = await Promise.all([
        this.getNearbyReports(coordinates, 500, 10),
        this.getWardInfo(coordinates)
      ]);

      return {
        success: true,
        context: {
          ward: wardData.ward,
          nearbyReports: nearbyData.nearbyReports,
          nearbyStats: nearbyData.stats,
          isHotspot: nearbyData.stats.recentCount >= 5, // 5+ reports in 7 days
          similarReportsNearby: nearbyData.nearbyReports.filter(
            r => r.category === report.category
          ).length
        }
      };

    } catch (error) {
      console.error('Error enriching report context:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Build context string for AI triage
   */
  buildContextString(contextData) {
    if (!contextData || !contextData.success) {
      return '';
    }

    const { context } = contextData;
    const parts = [];

    // Ward info
    if (context.ward) {
      parts.push(`Ward: ${context.ward.name} (${context.ward.zone})`);
    }

    // Nearby reports
    if (context.nearbyStats) {
      parts.push(`Nearby reports (500m): ${context.nearbyStats.total}`);
      parts.push(`Recent reports (7 days): ${context.nearbyStats.recentCount}`);
      
      if (context.similarReportsNearby > 0) {
        parts.push(`Similar reports nearby: ${context.similarReportsNearby}`);
      }
      
      if (context.isHotspot) {
        parts.push('⚠️ This is a hotspot area (5+ recent reports)');
      }
    }

    return parts.join(', ');
  }
}

module.exports = new GeospatialService();
