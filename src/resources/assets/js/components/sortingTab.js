import SorterStore from '../stores/sorters';
import {handleErrorResponse} from '../import';
import {LoaderMixin} from '../import';

/**
 * View model for the volume sorting tab
 */
export default {
    mixins: [LoaderMixin],
    props: {
        volumeId: {
            type: Number,
            required: true,
        },
        imageIds: {
            type: Array,
            required: true,
        }
    },
    data() {
        return {
            sorters: SorterStore,
            // true for ascending, false for descending
            direction: true,
            activeSorter: null,
            privateSequence: [],
        };
    },
    computed: {
        defaultSorter() {
            return this.sorters[0];
        },
        isActive() {
            return this.activeSorter !== this.defaultSorter.id || !this.direction;
        },
        isSortedAscending() {
            return this.direction;
        },
        isSortedDescending() {
            return !this.direction;
        },
        // Use "sorting2" to avoid conflicts with the previous version of the volume
        // sorter written in AngularJS.
        sorterStorageKey() {
            return `biigle.volumes.${this.volumeId}.sorting2.sorter`;
        },
        directionStorageKey() {
            return `biigle.volumes.${this.volumeId}.sorting2.direction`;
        },
        sequence() {
            if (this.direction) {
                return this.privateSequence;
            }

            return this.privateSequence.slice().reverse();
        },
    },
    methods: {
        reset() {
            this.direction = true;
            this.activeSorter = this.defaultSorter.id;
            this.privateSequence = biigle.$require('volumes.imageIds');
        },
        sortAscending() {
            this.direction = true;
        },
        sortDescending() {
            this.direction = false;
        },
        handleSelect(sorter) {
            if (this.loading) return;

            this.startLoading();
            sorter.getSequence()
                .then((sequence) => {
                    this.activeSorter = sorter.id;
                    this.privateSequence = sequence;
                })
                .catch(handleErrorResponse)
                .finally(this.finishLoading);
        },
        isValidSequence(sequence) {
            // A stored sorting sequence is invalid if it does not contain the IDs of all
            // images of the volume. It may contain more IDs if images have been
            // deleted in the meantime.
            let map = {};
            let ids = this.imageIds;

            for (let i = sequence.length - 1; i >= 0; i--) {
                map[sequence[i]] = true;
            }

            for (let i = ids.length - 1; i >= 0; i--) {
                if (!map.hasOwnProperty(ids[i])) {
                    return false;
                }
            }

            return true;
        },
    },
    watch: {
        sequence() {
            this.$emit('update', this.sequence, this.isActive);
        },
        privateSequence() {
            if (this.activeSorter === this.defaultSorter.id) {
                localStorage.removeItem(this.sorterStorageKey);
            } else {
                localStorage.setItem(this.sorterStorageKey, JSON.stringify({
                    id: this.activeSorter,
                    sequence: this.privateSequence,
                }));
            }
        },
        direction() {
            if (this.direction) {
                localStorage.removeItem(this.directionStorageKey);
            } else {
                localStorage.setItem(this.directionStorageKey, this.direction);
            }
        },
    },
    created() {
        this.privateSequence = biigle.$require('volumes.imageIds');

        let sorter = JSON.parse(localStorage.getItem(this.sorterStorageKey));
        if (sorter && this.isValidSequence(sorter.sequence)) {
            this.activeSorter = sorter.id;
            this.privateSequence = sorter.sequence;
        } else {
            this.activeSorter = this.defaultSorter.id;
            // Delete any invalid stored sorting sequence.
            localStorage.removeItem(this.sorterStorageKey);
        }

        let direction = JSON.parse(localStorage.getItem(this.directionStorageKey));
        if (direction !== null) {
            this.direction = direction;
        }
    },
};
