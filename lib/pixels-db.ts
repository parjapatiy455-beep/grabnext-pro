import { executeQuery } from '@/lib/db'

export interface PixelItem {
  id: string
  name: string
  type: 'facebook' | 'google_analytics' | 'tiktok' | 'custom_script'
  pixelId?: string | null
  scriptCode?: string | null
  placement: 'head' | 'body'
  triggerPage: 'all' | 'checkout' | 'success' | 'landing'
  testEventCode?: string | null
  description?: string | null
  isActive: number // 1 or 0
  createdAt: number
  updatedAt: number
}

export async function ensurePixelsTable() {
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS pixels (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      pixelId TEXT,
      scriptCode TEXT,
      placement TEXT DEFAULT 'head',
      triggerPage TEXT DEFAULT 'all',
      testEventCode TEXT,
      description TEXT,
      isActive INTEGER DEFAULT 1,
      createdAt INTEGER,
      updatedAt INTEGER
    );
  `)

  // Check if pixels table is empty, if so, seed default pixels so existing ones are visible & editable
  try {
    const existing = await executeQuery('SELECT COUNT(*) as count FROM pixels') as any[]
    const count = Number(existing?.[0]?.count || 0)
    if (count === 0) {
      const now = Date.now()
      const defaultPixels = [
        {
          id: 'pix_fb_main',
          name: 'Meta (Facebook) Pixel - Primary',
          type: 'facebook',
          pixelId: '1004524488604833',
          scriptCode: null,
          placement: 'head',
          triggerPage: 'all',
          testEventCode: '',
          description: 'Primary Meta Pixel for tracking page views, cart, and purchases',
          isActive: 1,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'pix_fb_backup1',
          name: 'Meta Pixel - Backup 1',
          type: 'facebook',
          pixelId: '1350267536434257',
          scriptCode: null,
          placement: 'head',
          triggerPage: 'all',
          testEventCode: '',
          description: 'Secondary backup pixel for audience data',
          isActive: 1,
          createdAt: now + 1,
          updatedAt: now + 1,
        },
        {
          id: 'pix_ga4_main',
          name: 'Google Analytics 4 (GA4)',
          type: 'google_analytics',
          pixelId: 'G-C3HYF0VYC0',
          scriptCode: null,
          placement: 'head',
          triggerPage: 'all',
          testEventCode: '',
          description: 'Google Analytics 4 web measurement stream',
          isActive: 1,
          createdAt: now + 2,
          updatedAt: now + 2,
        },
        {
          id: 'pix_clarity_main',
          name: 'Microsoft Clarity Heatmaps',
          type: 'custom_script',
          pixelId: 'wf91qtq1oa',
          scriptCode: `<script type="text/javascript">
(function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "wf91qtq1oa");
</script>`,
          placement: 'head',
          triggerPage: 'all',
          testEventCode: '',
          description: 'User session recordings and heatmaps',
          isActive: 1,
          createdAt: now + 3,
          updatedAt: now + 3,
        }
      ]

      for (const p of defaultPixels) {
        await executeQuery(
          `INSERT INTO pixels (id, name, type, pixelId, scriptCode, placement, triggerPage, testEventCode, description, isActive, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [p.id, p.name, p.type, p.pixelId, p.scriptCode, p.placement, p.triggerPage, p.testEventCode, p.description, p.isActive, p.createdAt, p.updatedAt]
        ).catch(() => {})
      }
    }
  } catch (err) {
    console.error('[Pixels Table Check Exception]', err)
  }
}

export async function getAllPixels(): Promise<PixelItem[]> {
  await ensurePixelsTable()
  const rows = await executeQuery('SELECT * FROM pixels ORDER BY createdAt ASC') as any[]
  return Array.isArray(rows) ? rows : []
}

export async function getActivePixels(): Promise<PixelItem[]> {
  await ensurePixelsTable()
  const rows = await executeQuery('SELECT * FROM pixels WHERE isActive = 1 ORDER BY createdAt ASC') as any[]
  return Array.isArray(rows) ? rows : []
}
