import { createClient} from "@supabase/supabase-js";
import { config } from './config/environment';

const SUPABASE_URL = config.SUPABASE_URL as string;
const SUPABASE_KEY = config.SUPABASE_ANON_KEY as string;

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
