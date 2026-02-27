import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface DuplicateRecord {
  vehicle_id: string;
  vehicle_number: string;
  document_type_id: string;
  document_type_name: string;
  duplicate_count: number;
  doc_ids: string[];
  created_dates: string[];
  file_names: string[];
}

interface CleanupReport {
  vehiclesAffected: number;
  totalDocumentsDeleted: number;
  deletionDetails: {
    vehicleId: string;
    vehicleNumber: string;
    documentCategory: string;
    documentsDeleted: number;
    keptDocumentId: string;
    deletedDocumentIds: string[];
    deletedFiles: string[];
  }[];
  timestamp: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: duplicates, error: queryError } = await supabase.rpc('get_duplicate_documents');

    if (queryError) {
      const { data: manualDuplicates, error: manualError } = await supabase
        .from('vehicle_documents')
        .select(`
          vehicle_id,
          document_type_id,
          vehicle_document_id,
          created_at,
          file_name,
          attachment_url,
          vehicles(vehicle_number),
          document_types(document_type_name)
        `)
        .order('created_at', { ascending: false });

      if (manualError) throw manualError;

      const duplicateMap = new Map<string, any[]>();

      manualDuplicates?.forEach((doc: any) => {
        const key = `${doc.vehicle_id}_${doc.document_type_id}`;
        if (!duplicateMap.has(key)) {
          duplicateMap.set(key, []);
        }
        duplicateMap.get(key)!.push(doc);
      });

      const actualDuplicates: DuplicateRecord[] = [];
      duplicateMap.forEach((docs, key) => {
        if (docs.length > 1) {
          actualDuplicates.push({
            vehicle_id: docs[0].vehicle_id,
            vehicle_number: docs[0].vehicles?.vehicle_number || 'Unknown',
            document_type_id: docs[0].document_type_id,
            document_type_name: docs[0].document_types?.document_type_name || 'Unknown',
            duplicate_count: docs.length,
            doc_ids: docs.map(d => d.vehicle_document_id),
            created_dates: docs.map(d => d.created_at),
            file_names: docs.map(d => d.file_name),
          });
        }
      });

      if (actualDuplicates.length === 0) {
        return new Response(
          JSON.stringify({
            message: 'No duplicate documents found',
            report: {
              vehiclesAffected: 0,
              totalDocumentsDeleted: 0,
              deletionDetails: [],
              timestamp: new Date().toISOString(),
            }
          }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      const report: CleanupReport = {
        vehiclesAffected: actualDuplicates.length,
        totalDocumentsDeleted: 0,
        deletionDetails: [],
        timestamp: new Date().toISOString(),
      };

      for (const duplicate of actualDuplicates) {
        const [keepDocId, ...deleteDocIds] = duplicate.doc_ids;
        const deletedFiles: string[] = [];

        const { data: docsToDelete, error: fetchError } = await supabase
          .from('vehicle_documents')
          .select('attachment_url')
          .in('vehicle_document_id', deleteDocIds);

        if (!fetchError && docsToDelete) {
          for (const doc of docsToDelete) {
            if (doc.attachment_url) {
              deletedFiles.push(doc.attachment_url);
              await supabase.storage
                .from('vehicle-documents')
                .remove([doc.attachment_url]);
            }
          }
        }

        const { error: deleteError } = await supabase
          .from('vehicle_documents')
          .delete()
          .in('vehicle_document_id', deleteDocIds);

        if (!deleteError) {
          report.totalDocumentsDeleted += deleteDocIds.length;
          report.deletionDetails.push({
            vehicleId: duplicate.vehicle_id,
            vehicleNumber: duplicate.vehicle_number,
            documentCategory: duplicate.document_type_name,
            documentsDeleted: deleteDocIds.length,
            keptDocumentId: keepDocId,
            deletedDocumentIds: deleteDocIds,
            deletedFiles: deletedFiles,
          });
        }
      }

      return new Response(
        JSON.stringify({
          message: 'Duplicate cleanup completed successfully',
          report,
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        message: 'No duplicates found or cleanup completed',
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error: any) {
    console.error('Error cleaning up duplicates:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to cleanup duplicate documents',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
