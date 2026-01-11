-- Enable RLS on verification_codes (should already be enabled, but ensure it)
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- No public SELECT policy - only service role can read
-- No public INSERT policy - only service role can insert
-- No public UPDATE policy - only service role can update
-- No public DELETE policy - only service role can delete

-- Create a restrictive policy that denies all access to regular users
-- The service role bypasses RLS, so edge functions will still work
CREATE POLICY "No public access to verification codes"
ON public.verification_codes
FOR ALL
TO public
USING (false)
WITH CHECK (false);